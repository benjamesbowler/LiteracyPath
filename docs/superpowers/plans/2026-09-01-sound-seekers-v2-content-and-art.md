# Sound Seekers v2 Content and Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the complete 40-expedition, 60-high-frequency-word, 40-connected-scene, eight-biome adventure and its unified illustrated 2D visual system without changing the approved 40-stop curriculum.

**Architecture:** `questSequence.js` remains an immutable curriculum input containing exactly 40 stops and 103 unique teach entries. Feature-local catalogs add expedition slots, truthful high-frequency-word mappings, connected text, relationship arcs, and semantic biome kits; generated pronunciation/meaning outputs remain owned by their generator. Task 4 defines raster contracts, Task 5 materializes them, and Task 6 validates and renders a dev-only content/art gallery without claiming that the later production runtime exists.

**Tech Stack:** JavaScript ES modules, React/SVG/CSS, Node `node:test`, Sharp asset inspection, Google Cloud text-to-speech for controlled-scene narration, OpenAI image generation, and Playwright.

**Spec:** `docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md`

## Required dependency gate

Do not start Task 1 until Task 5 of `docs/superpowers/plans/2026-09-01-sound-seekers-v2-learning-foundation.md` is committed and its review is clean. Treat the committed modules and tests as the prerequisite interface, not the older illustrative object shapes in that plan. Confirm all of the following from the committed tree:

- `SOUND_POWER_IDS` exports exactly `echo_search`, `contrast_sort`, `word_forge`, `blend_bridge`, `memory_delivery`, and `story_power`.
- Hyphenated strings such as `echo-search-teach` remain instruction/audio IDs only; expedition `powerId` values use the imported underscore IDs.
- Every recordable phase and content opportunity resolves an exact authored decision-contract tuple `(instructionId, powerId, expectedAction, recordsDomain)` from the current `instructionContracts.js`. A power ID never implies one domain: Contrast Sort has three legitimate decision variants, Memory Delivery has four, and Blend Bridge owns both its ordinary word-decoding decision and the authored novel-decoding boss decision.
- Teach-all covers all 103 target entries without exposing an internal ID, and `suffix_s`, `suffix_ing`, and `suffix_ed` use morphology teaching rather than “listen for the sound.” The foundation does **not** own review-stop sequencing: Content Task 1 below creates the canonical deterministic source for `s8` and `s17` from targets taught strictly before each review stop.
- `src/features/soundSeekers/content/instructionContracts.js` exports `SOUND_POWER_IDS`, `SOUND_SEEKERS_INSTRUCTIONS`, and `getInstructionContract()`; `src/features/soundSeekers/engine/teachSequence.js` exports `createTeachSequence()` and `reduceTeachSequence()`; the challenge, evidence, and state modules expose their committed v2 APIs. Do not invent a `getTeachSequence()` or other interface merely because an earlier plan example named it.
- Derive the required recording set from `Object.values(SOUND_SEEKERS_INSTRUCTIONS).filter(contract => !contract.silenceIsIntentional)`, then require one exact `SOURCE.md` asset and file per derived instruction ID. Neither the plan nor tests may hard-code the current count. Hashes must match, temporary source files must be absent, and direct listening status must be recorded truthfully.
- The worktree is free of another task's unstaged changes to any file named by the task being started.

Run:

```bash
node --test tests/unit/soundSeekersInstructionContracts.test.js tests/unit/soundSeekersTeachSequence.test.js tests/unit/soundSeekersAudioDelivery.test.js
node --input-type=module - <<'NODE'
import { SOUND_SEEKERS_INSTRUCTIONS } from "./src/features/soundSeekers/content/instructionContracts.js";
const required = Object.values(SOUND_SEEKERS_INSTRUCTIONS)
  .filter(contract => !contract.silenceIsIntentional)
  .map(contract => contract.instructionId)
  .sort();
console.log(JSON.stringify({ requiredCount: required.length, instructionIds: required }, null, 2));
NODE
git status --short
```

Expected: tests pass; any remaining direct-listening gate is explicitly reported rather than inferred from signal checks. If foundation files are still changing, stop and coordinate instead of copying their interfaces.

## Global constraints

- Keep exactly 40 stop IDs, `s1` through `s40`, in the existing order.
- Keep exactly 103 unique teach entries. Do not add, remove, reorder, rename, or reclassify a target in `questSequence.js`.
- `s8` and `s17` teach no new target and must declare `teach.mode: "review"` plus the canonical `reviewSourceId`; their concrete review targets are resolved deterministically at mission creation from prior teaching and v2 practice evidence. Every other stop declares the exact new target IDs already present at that stop.
- Leave legacy `act`, `world`, `shells`, `heartWords`, `pages`, and `boss` fields unchanged until the separate cutover plan. V2 bosses occur at `s5`, `s10`, `s15`, `s20`, `s25`, `s30`, `s35`, and `s40` in the expedition catalog.
- Import `SOUND_POWER_IDS` from the committed instruction-contract authority. Do not duplicate literal power-ID lists in production code.
- There are exactly eight chapters and five expeditions per chapter.
- Preserve the existing 32 named identities: one guide and three residents per chapter. Five relationship beats do not create a fifth character.
- Every expedition declares arrival, teach/review, two distinct challenge applications, Wonder, transfer, payoff, safe resume, two high-frequency-word opportunity slots, one connected-text foreign key, and a natural stopping point.
- First-use power onboarding is non-recording and consequence-free. A tutorial/replay input never emits literacy evidence.
- Every fifth expedition is an authored controlled novel-decoding boss. Use a real controlled word by default. Only under a reviewed authored exception may an imaginary name be used; that exception must first add the name to the canonical authored pronunciation source with `imaginary: true`, explicit units, and an explicit `evidenceTargetId` on every assessed unit, regenerate the canonical record, and reference its `wordId`. Never author an inline spelling-derived unit list or add the name to the teach sequence.
- Keep the canonical set of 60 declared high-frequency words. Introduce no more than two per stop and serve all 60 during a deterministic first 40-stop journey.
- A high-frequency-word record partitions the canonical pronunciation units into `regularParts` and `heartParts`. Either array may be empty; they may not both be empty, overlap, omit a unit, or invent irregularity.
- Recognition, heart-part mapping, encoding, and sentence use are distinct `activityType` values under truthful high-frequency-word evidence. None fan out into GPC evidence.
- Every first-visit content opportunity is a structural expedition foreign key, not merely a scheduler simulation. In particular, all 80 high-frequency-word slots are explicit child-reachable `heartWordOpportunities`, each with its own stop-qualified ID, insertion point, slot foreign key, and the exact Memory Delivery heart-word decision tuple. They are additional mission subphases and never overwrite the `powerId` or decision contract of the challenge phase before them.
- Every connected-text scene is reachable through its expedition foreign key. Assessed choices have one defensible text-supported answer; narrative choices persist a consequence and emit no correctness.
- Child-required running text and readable option labels use only words supported at that stop plus explicitly introduced high-frequency words. Prompts supplied orally are not silently counted as child-readable text.
- Every Word Forge and Blend Bridge phase declares one exact `wordId`. Its ordered `unitTargetIds` are copied only from that word's canonical authored pronunciation units, in unit order, using each unit's explicit `evidenceTargetId`. Shipping v2 content must never call or validate against legacy `segmentWord()` or `evidenceTargetFor()`. The word also resolves to one canonical pronunciation and one approved child-safe meaning. Meaning art/action must not reveal the decoding answer before the literacy decision.
- `pronunciationRecords.js` and `wordMeanings.js` are generated outputs. Edit their generator/source inputs, regenerate, and verify; never hand-edit them.
- Every connected scene has a production-candidate narration file, exact text/hash provenance, replay support, and truthful human-listening status.
- Every chapter has a unique semantic 2D identity, at least three depth layers, five landmarks with dormant/repaired states, one cast, one prop/reward family, a route material, task camera, simplified profile, reduced-motion replacement, and responsive crop/focal contracts.
- Visual meaning never depends on color alone. Shape, pattern, silhouette, text alternative, or state label carries the same distinction.
- Raw palette values live only in `visualTokens.js`. Biome manifests reference token IDs; JSX uses tokens; CSS uses custom properties.
- Raster art contains no text, logos, watermarks, borders, interface, or imitation of third-party characters. Graphemes, captions, controls, focus, sound boxes, masks, particles, and target plates remain code-native.
- Every accepted raster has project-bound provenance in `public/game-assets/sound-seekers/v2/SOURCE.md`. Rejected variants and temporary conversion files are removed.
- Generated crop sheets, screenshots, console/request logs, and run summaries live only under ignored `.artifacts/sound-seekers-v2/`. They are never staged under `docs/`; only durable schemas, governance, and authored provenance belong in checked-in documentation.
- Automated checks prove structure, hashes, dimensions, references, and renderability. They do not prove listening quality, crop quality, semantic recognizability, physical-device behavior, observed-child comprehension, deployment, or production operation.

## Canonical recordable decision-contract tuples

Content authors and validators copy these exact current contracts; they do not derive `expectedAction` or `recordsDomain` from `powerId`. The implementation test also derives the decision-contract set from `SOUND_SEEKERS_INSTRUCTIONS` and fails if this checked plan table and the committed authority diverge.

| Instruction ID | Power ID | Expected action | Records domain |
|---|---|---|---|
| `echo-search-find-source` | `echo_search` | `reveal_matching_grapheme` | `phoneme_to_grapheme` |
| `contrast-sort-place-sound` | `contrast_sort` | `place_sound_token` | `grapheme_to_phoneme` |
| `contrast-sort-place-decoded-word` | `contrast_sort` | `place_decoded_word_token` | `word_decoding` |
| `contrast-sort-place-heart-word` | `contrast_sort` | `place_heart_word_token` | `heart_word_mapping` |
| `word-forge-place-tile` | `word_forge` | `place_grapheme_tile` | `word_segmentation_encoding` |
| `blend-bridge-choose-meaning` | `blend_bridge` | `choose_blended_meaning` | `word_decoding` |
| `blend-bridge-choose-novel-meaning` | `blend_bridge` | `choose_novel_decoded_meaning` | `novel_decoding` |
| `memory-delivery-deliver-sound` | `memory_delivery` | `deliver_sound_cue` | `phoneme_to_grapheme` |
| `memory-delivery-deliver-decoded-word` | `memory_delivery` | `deliver_decoded_word_cue` | `word_decoding` |
| `memory-delivery-deliver-heart-word` | `memory_delivery` | `deliver_heart_word_cue` | `heart_word_mapping` |
| `memory-delivery-follow-decoded-instruction` | `memory_delivery` | `follow_decoded_instruction` | `connected_text_transfer` |
| `story-power-choose-story-action` | `story_power` | `choose_story_action` | `connected_text_transfer` |

Every tuple above has at least one authored stop/phase/content record. The runtime plan must additionally provide one playable preview fixture for every tuple, including all three Contrast Sort variants, all four Memory Delivery variants, and the Blend Bridge novel-decoding boss.

## Canonical producer-to-consumer order

| Producer | Required consumers |
|---|---|
| Committed foundation IDs, teach contracts, director, evidence/state APIs | Task 1 campaign/review source and Task 2 coverage |
| Task 1 expedition/chapter deltas, deterministic prior-teaching review source, and content-slot foreign keys | Tasks 2, 3, 4, 6 and the later runtime plan |
| Task 2 five authored deck catalogs, scheduler/record/resume APIs, activity subtype, and merge-safe decks | Task 3 scene validator, Task 6 coverage gate, and the exact runtime consumers named in Task 2 |
| Task 3 connected scenes, narration, meaning source, cast arcs | Task 4 semantic kits, Task 6 gallery, later Story Power/Workbench |
| Task 4 biome contracts, token IDs, layer/character/landmark components | Task 5 image briefs and crop contracts, Task 6 gallery |
| Task 5 accepted WebPs and SOURCE manifest | Task 6 asset/art/offline gates and later runtime |
| Task 6 static gates/gallery evidence | Runtime plan; never the reverse |

---

### Task 1: Complete the committed immutable-curriculum campaign and structural content slots

**Files:**
- Modify: `src/features/soundSeekers/content/chapters/seedwakeMeadow.js`
- Modify: `src/features/soundSeekers/content/chapters/riverGardens.js`
- Modify: `src/features/soundSeekers/content/chapters/fossilCanyon.js`
- Modify: `src/features/soundSeekers/content/chapters/forgeSettlement.js`
- Modify: `src/features/soundSeekers/content/chapters/glassMarsh.js`
- Modify: `src/features/soundSeekers/content/chapters/stormCoast.js`
- Modify: `src/features/soundSeekers/content/chapters/lanternForest.js`
- Modify: `src/features/soundSeekers/content/chapters/starReach.js`
- Modify: `src/features/soundSeekers/content/chapters/index.js`
- Modify: `src/features/soundSeekers/content/expeditions.js`
- Modify/replace in place: `src/features/soundSeekers/content/reviewSequences.js`
- Modify source: `tools/buildSoundSeekersPronunciationLexicon.mjs`
- Modify generated: `src/features/soundSeekers/content/pronunciationRecords.js`
- Create generated invariant: `src/features/soundSeekers/content/pronunciationCorpusInvariant.generated.js`
- Modify: `src/features/soundSeekers/content/pronunciationLexicon.js`
- Modify: `tests/unit/soundSeekersPronunciationLexicon.test.js`
- Modify: `tests/unit/soundSeekersExpeditions.test.js`
- Modify/replace in place: `tests/unit/soundSeekersReviewSequences.test.js`

Commit `7659eaf83` already created the eight chapter deltas, `expeditions.js`, `reviewSequences.js`, and their focused tests. Rebase this task onto that real tree; do not recreate those files or introduce a parallel `reviewTargetSource.js`. The committed implementation is a useful authored baseline, but five named red gaps remain: it is missing five decision tuples (`contrast-sort-place-decoded-word`, `contrast-sort-place-heart-word`, `memory-delivery-deliver-sound`, `memory-delivery-deliver-decoded-word`, and `memory-delivery-follow-decoded-instruction`); it has slot IDs but not 80 separate child-reachable heart-word opportunity records; it has no complete five-category slot map; review selection is a static target window rather than evidence-sensitive adaptive selection; and it has no generated pronunciation-corpus invariant. The tests in this task must fail specifically for those five gaps before production changes begin.

Do not modify `src/data/questSequence.js` or `src/data/questChapters.js` in this task. The former is the immutable target-order input; the latter remains the legacy identity/runtime adapter until cutover. Feature-local chapter modules contain only v2 deltas keyed to existing chapter IDs, avoiding a second copy of titles, casts, rewards, audio, and legacy `worldKit` fields.

**Interfaces:**
- Consumes: `QUEST_STOPS` and `QUEST_CHAPTERS`; imported `SOUND_POWER_IDS`, `getInstructionContract(instructionId)`, committed `createTeachSequence()`/`reduceTeachSequence()` behavior, `selectNextChallenge(context)`, and `getPronunciation()` as the sole shipping word/unit authority.
- Produces: `SOUND_SEEKERS_CHAPTERS`, `SOUND_SEEKERS_EXPEDITIONS`, `getExpedition(stopId)`, `CONTENT_DECK_SLOT_IDS`, `HEART_WORD_SLOT_IDS`, `HEART_WORD_OPPORTUNITY_IDS`, and `CONNECTED_TEXT_IDS`.
- Evolve or replace the existing `reviewSequences.js` in place as the sole review-stop target authority. Remove its static review-window API if it cannot satisfy the adaptive contract; do not leave `SOUND_SEEKERS_REVIEW_SEQUENCES`/`getReviewSequence()` as a competing production source. The file exports `SOUND_SEEKERS_REVIEW_SOURCE_ID`, `reviewCandidateTargetIds(stopId)`, and `createReviewTargetSequence({ stopId, state, seed, count })`. Candidate IDs are the stable first-introduction order from `QUEST_STOPS` with `stop.index < reviewStop.index`; the function rejects non-review stops, requires a positive caller-owned slot count, repeatedly calls the committed `selectNextChallenge()` over the shrinking eligible set, and returns a frozen unique sequence. It may prioritize immutable v2 evidence through the director, but can never select the current/future curriculum or use travel, timing, collision, device, reward, or cosmetic state. Same stop/state/seed/count must reproduce byte-for-byte after resume.
- Extends the canonical authored pronunciation-unit schema with `evidenceTargetId`. Every scored Word Forge, Blend Bridge, and boss unit must carry one exact target ID already taught by that stop. The pronunciation validator rejects missing/unknown evidence targets on any word used by those phases. Non-assessed units may use `evidenceTargetId: null`; they cannot be copied into `unitTargetIds`.
- After Task 1 finishes its permitted pronunciation-unit metadata and any reviewed authored-exception imaginary entry, the generator writes `pronunciationCorpusInvariant.generated.js` with the sorted canonical record IDs and their content hash. The exported count is derived as `recordIds.length`; no plan, test, or checker contains a numeric corpus-count literal. Later content tasks consume this invariant and do not regenerate it unless a separately reviewed task intentionally changes corpus membership.
- Expedition shape:

```js
{
  id: "expedition-s1",
  stopId: "s1",
  stopIndex: 1,
  chapterId: "seedwake-meadow",
  title: "Wake the Seed Lanterns",
  residentId: "Moss",
  arrival: { problemId: "seed-lanterns-dark", consequencePreviewId: "seedwake-path-dark" },
  teach: {
    mode: "introduce",
    targetIds: ["a", "m", "t", "s"],
    reviewSourceId: null,
    instructionIds: ["echo-search-teach"],
    scored: false
  },
  phases: [
    { id: "s1-arrival", kind: "arrival", recordsDomain: null },
    { id: "s1-teach", kind: "teach", recordsDomain: null },
    { id: "s1-primary", kind: "challenge", powerId: SOUND_POWER_IDS.ECHO_SEARCH, instructionId: "echo-search-find-source", expectedAction: "reveal_matching_grapheme", recordsDomain: "phoneme_to_grapheme", contextId: "s1-seed-lantern-search", targetIds: ["a"] },
    { id: "s1-secondary", kind: "challenge", powerId: SOUND_POWER_IDS.WORD_FORGE, instructionId: "word-forge-place-tile", expectedAction: "place_grapheme_tile", recordsDomain: "word_segmentation_encoding", contextId: "s1-path-mat-forge", wordId: "mat", unitTargetIds: ["m", "a", "t"] },
    { id: "s1-wonder", kind: "wonder", recordsDomain: null },
    { id: "s1-transfer", kind: "transfer", powerId: SOUND_POWER_IDS.STORY_POWER, instructionId: "story-power-choose-story-action", expectedAction: "choose_story_action", recordsDomain: "connected_text_transfer", contextId: "s1-seed-story", connectedTextId: "scene-s1" },
    { id: "s1-payoff", kind: "payoff", recordsDomain: null }
  ],
  heartWordSlotIds: ["heart-slot-s1-1", "heart-slot-s1-2"],
  heartWordOpportunities: [
    { id: "s1-heart-1", kind: "content_opportunity", afterPhaseId: "s1-primary", slotId: "heart-slot-s1-1", category: "heartWords", powerId: SOUND_POWER_IDS.MEMORY_DELIVERY, instructionId: "memory-delivery-deliver-heart-word", expectedAction: "deliver_heart_word_cue", recordsDomain: "heart_word_mapping", allowedActivityTypes: ["recognition", "heart_part_mapping", "encoding", "sentence_use"] },
    { id: "s1-heart-2", kind: "content_opportunity", afterPhaseId: "s1-secondary", slotId: "heart-slot-s1-2", category: "heartWords", powerId: SOUND_POWER_IDS.MEMORY_DELIVERY, instructionId: "memory-delivery-deliver-heart-word", expectedAction: "deliver_heart_word_cue", recordsDomain: "heart_word_mapping", allowedActivityTypes: ["recognition", "heart_part_mapping", "encoding", "sentence_use"] }
  ],
  contentDeckSlotIds: {
    heartWords: ["heart-slot-s1-1", "heart-slot-s1-2"],
    stories: ["story-slot-s1"],
    alternatives: [],
    morphology: [],
    transfer: ["transfer-slot-s1"]
  },
  connectedTextId: "scene-s1",
  wonder: { id: "sound-ripples-wake-the-meadow", representation: "sound-to-light-ripple" },
  transfer: { boss: false, imaginary: false },
  payoff: { repairId: "wake-seeds", relationshipBeatId: "seedwake-s1-help", consequenceId: "seedwake-path-lit" },
  resume: { safePhaseIds: ["s1-arrival", "s1-teach", "s1-primary", "s1-secondary", "s1-transfer", "s1-payoff"] },
  naturalStop: true
}
```

- Chapter delta shape:

```js
{
  id: "seedwake-meadow",
  stopIds: ["s1", "s2", "s3", "s4", "s5"],
  repairBeatIds: ["wake-seeds", "mend-hedge", "light-mill", "raise-bridge", "open-meadow-gate"],
  wonderId: "sound-ripples-wake-the-meadow",
  bossTransferId: "bramble-gate-novel-decode",
  biomeKitId: "seedwake-meadow"
}
```

- [ ] **Step 1: Write failing curriculum-lock and campaign-structure tests**

```js
test("campaign preserves the exact 40-stop and 103-target curriculum", () => {
  assert.equal(SOUND_SEEKERS_EXPEDITIONS.length, 40);
  assert.deepEqual(SOUND_SEEKERS_EXPEDITIONS.map(item => item.stopId), QUEST_STOPS.map(item => item.id));
  assert.equal(new Set(QUEST_STOPS.flatMap(stop => stop.teach.map(item => item.id))).size, 103);
  for (const [index, expedition] of SOUND_SEEKERS_EXPEDITIONS.entries()) {
    assert.deepEqual(expedition.teach.targetIds, QUEST_STOPS[index].teach.map(item => item.id));
  }
  assert.equal(getExpedition("s8").teach.mode, "review");
  assert.equal(getExpedition("s17").teach.mode, "review");
  assert.deepEqual(getExpedition("s8").teach.targetIds, []);
  assert.deepEqual(getExpedition("s17").teach.targetIds, []);
  assert.equal(getExpedition("s8").teach.reviewSourceId, SOUND_SEEKERS_REVIEW_SOURCE_ID);
  assert.equal(getExpedition("s17").teach.reviewSourceId, SOUND_SEEKERS_REVIEW_SOURCE_ID);
});

test("review stops resolve deterministically from targets taught strictly before the stop", () => {
  for (const stopId of ["s8", "s17"]) {
    const source = reviewCandidateTargetIds(stopId);
    const prior = new Set(QUEST_STOPS
      .filter(stop => stop.index < QUEST_STOPS.find(item => item.id === stopId).index)
      .flatMap(stop => stop.teach.map(item => item.id)));
    assert.ok(source.length > 0);
    assert.equal(source.every(targetId => prior.has(targetId)), true);

    const input = { stopId, state: practicedReviewState(), seed: 11, count: 2 };
    const first = createReviewTargetSequence(input);
    const resumed = createReviewTargetSequence(structuredClone(input));
    assert.deepEqual(resumed, first);
    assert.equal(new Set(first.targetIds).size, first.targetIds.length);
    assert.equal(first.targetIds.every(targetId => prior.has(targetId)), true);
  }
  assert.throws(() => createReviewTargetSequence({ stopId: "s9", state: freshState(), seed: 11, count: 2 }));
});

test("every expedition publishes real first-visit content foreign keys", () => {
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    assert.deepEqual(expedition.phases.map(phase => phase.kind), [
      "arrival", "teach", "challenge", "challenge", "wonder", "transfer", "payoff"
    ]);
    assert.deepEqual(expedition.heartWordSlotIds, [
      `heart-slot-${expedition.stopId}-1`,
      `heart-slot-${expedition.stopId}-2`
    ]);
    assert.deepEqual(expedition.contentDeckSlotIds.heartWords, expedition.heartWordSlotIds);
    assert.deepEqual(expedition.contentDeckSlotIds.stories, [`story-slot-${expedition.stopId}`]);
    assert.deepEqual(expedition.contentDeckSlotIds.transfer, [`transfer-slot-${expedition.stopId}`]);
    assert.equal(expedition.connectedTextId, `scene-${expedition.stopId}`);
    assert.equal(expedition.heartWordOpportunities.length, 2);
    assert.deepEqual(expedition.heartWordOpportunities.map(item => item.slotId), expedition.heartWordSlotIds);
    for (const [index, opportunity] of expedition.heartWordOpportunities.entries()) {
      assert.equal(opportunity.id, `${expedition.stopId}-heart-${index + 1}`);
      assert.equal(expedition.phases.some(phase => phase.id === opportunity.afterPhaseId), true);
      assert.deepEqual(
        pickDecisionTuple(opportunity),
        ["memory-delivery-deliver-heart-word", "memory_delivery", "deliver_heart_word_cue", "heart_word_mapping"]
      );
    }
    assert.equal(
      expedition.phases.find(phase => phase.kind === "transfer").connectedTextId,
      expedition.connectedTextId
    );
    assert.ok(expedition.payoff.repairId);
    assert.ok(expedition.payoff.relationshipBeatId);
    assert.equal(expedition.naturalStop, true);
  }
});

test("power and instruction IDs resolve through foundation authorities", () => {
  const allowed = new Set(Object.values(SOUND_POWER_IDS));
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const actions = [...expedition.phases, ...expedition.heartWordOpportunities].filter(item => item.powerId);
    for (const action of actions) {
      assert.ok(allowed.has(action.powerId), `${expedition.stopId}:${action.powerId}`);
      const contract = getInstructionContract(action.instructionId);
      assert.deepEqual(
        pickDecisionTuple(action),
        [contract.instructionId, contract.powerId, contract.expectedAction, contract.recordsDomain]
      );
    }
  }
});

test("campaign content authors every current recordable decision-contract tuple", () => {
  const required = Object.values(SOUND_SEEKERS_INSTRUCTIONS)
    .filter(contract => contract.phase === "decision")
    .map(pickDecisionTupleFromContract);
  const authored = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition =>
    [...expedition.phases, ...expedition.heartWordOpportunities]
      .filter(item => item.instructionId)
      .map(pickDecisionTuple)
  );
  for (const tuple of required) {
    assert.equal(authored.some(candidate => deepEqualTuple(candidate, tuple)), true, tuple.join("|"));
  }
});

test("authored challenge and boss units never outrun the curriculum", () => {
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const taughtThroughStop = new Set(QUEST_STOPS
      .filter(stop => stop.index <= expedition.stopIndex)
      .flatMap(stop => stop.teach.map(item => item.id)));
    const claimed = expedition.phases.flatMap(phase => [
      ...(phase.targetIds || []),
      ...(phase.unitTargetIds || [])
    ]);
    for (const targetId of claimed) assert.ok(taughtThroughStop.has(targetId), `${expedition.stopId}:${targetId}`);
    for (const phase of expedition.phases.filter(item => item.wordId)) {
      const pronunciation = getPronunciation(phase.wordId);
      assert.ok(pronunciation);
      const authoredEvidenceTargets = pronunciation.units.map(unit => unit.evidenceTargetId);
      assert.ok(authoredEvidenceTargets.every(Boolean), `${phase.wordId}: explicit evidenceTargetId`);
      assert.deepEqual(phase.unitTargetIds, authoredEvidenceTargets);
    }
  }
});

test("v2 word-unit contracts do not depend on legacy spelling segmentation", () => {
  const source = readFileSync(new URL("../../src/features/soundSeekers/content/expeditions.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /segmentWord|evidenceTargetFor/u);
});

test("each fifth stop is the v2 transfer boss without changing legacy boss flags", () => {
  assert.deepEqual(
    SOUND_SEEKERS_EXPEDITIONS.filter(item => item.transfer.boss).map(item => item.stopId),
    ["s5", "s10", "s15", "s20", "s25", "s30", "s35", "s40"]
  );
  assert.deepEqual(QUEST_STOPS.filter(item => item.boss).map(item => item.id), ["s8", "s17", "s40"]);
});
```

- [ ] **Step 2: Run the campaign test and confirm the red state**

Run:

```bash
node --test tests/unit/soundSeekersExpeditions.test.js tests/unit/soundSeekersReviewSequences.test.js tests/unit/soundSeekersPronunciationLexicon.test.js
```

Expected: FAIL on the committed `7659eaf83` baseline for the five named gaps only: five missing decision tuples, 80 missing separate opportunity records, the incomplete five-category slot map, static rather than adaptive review selection, and the missing generated corpus invariant. If a failure instead says that the already committed campaign files do not exist, the worker is on the wrong base and must stop.

- [ ] **Step 3: Author the eight chapter deltas and all 40 expeditions**

Use these exact chapter/cast boundaries:

| Chapter | Stops | Existing identities | Arc |
|---|---|---|---|
| Seedwake Meadow | s1–s5 | Bouncy, Moss, Tumble, Bramble | Relight a dawn path through sound discovery and first word construction. |
| River Gardens | s6–s10 | Nori, Fizz, Quill, Rill | Classify and deliver sound cargo to restore canals and terraces. |
| Fossil Canyon | s11–s15 | Fen, Rook, Amber, Claw | Blend decoded trail marks to reconnect an excavation team. |
| Forge Settlement | s16–s20 | Cinder, Bolt, Soot, Bellows | Encode working instructions that rebuild copper and iron machines. |
| Glass Marsh | s21–s25 | Vale, Ripple, Mica, Glint | Distinguish reflected confusions to reveal a safe route. |
| Storm Coast | s26–s30 | Skiff, Kelp, Boom, Prism | Remember and apply cues to restore shelters and a lighthouse lens. |
| Lantern Forest | s31–s35 | Echo, Luma, Wisp, Orbit | Apply controlled text to rebuild a living map. |
| Star Reach | s36–s40 | Nova, Comet, Aster, Dawn | Integrate all six powers to reconnect the sky road through novel transfer. |

Rules enforced while authoring:

- In `chapters/index.js`, join each v2 delta to its one matching `QUEST_CHAPTERS` record by ID. Export a frozen enriched record that retains the legacy title, `cast`, reward, audio, and identity fields and adds only the v2 delta. Assert a one-to-one eight-ID join; never copy the 32 identity records into the new chapter files.
- For `s8` and `s17`, keep `teach.mode` as `"review"`, keep `targetIds` empty, replace the committed `reviewTargetIds` snapshot with `reviewSourceId: SOUND_SEEKERS_REVIEW_SOURCE_ID`, and remove any production import of `getReviewSequence()`. Evolve or replace `reviewSequences.js` itself as described above and update `soundSeekersReviewSequences.test.js`; do not create a second review module. Assert that `reviewCandidateTargetIds()` contains only strict-prior teaching while `createReviewTargetSequence()` is deterministic across replay/resume, evidence-sensitive through `selectNextChallenge()`, unique within the requested sequence, and fail-closed for every non-review stop or impossible count.
- Give every expedition category-keyed structural slots. All 40 have two `heartWords`, one `stories`, and one `transfer` slot; only stops with an authored alternative-pronunciation or morphology application declare those category slots. Task 2 must account for every declared slot and may not invent a scheduler-only opportunity with no expedition foreign key.
- Author exactly two stop-qualified `heartWordOpportunities` per expedition, for 80 unique opportunities in all. Each points to one real heart-word slot, names an existing `afterPhaseId`, and copies the exact tuple `("memory-delivery-deliver-heart-word", "memory_delivery", "deliver_heart_word_cue", "heart_word_mapping")`. The runtime inserts it as a separate playable subphase after that phase; it may not replace or mutate the parent phase's `powerId`, instruction, expected action, or domain.
- The two challenge phases use different power IDs and different cognitive actions.
- Across the 40 expeditions, author at least one real stop/phase/content context for every current decision tuple in the canonical table. This includes all three Contrast Sort variants, all four Memory Delivery variants, ordinary and novel-decoding Blend Bridge, and the Story Power transfer. Validate all four tuple fields against `getInstructionContract()`; matching only `powerId` is insufficient.
- Extend the authored tuples/records in `tools/buildSoundSeekersPronunciationLexicon.mjs` with explicit evidence-target metadata, regenerate `pronunciationRecords.js`, and make `assertShippingPronunciationLexicon()` validate that metadata against the immutable curriculum target set. The generator may assist an author, but accepted v2 units must persist the reviewed mapping; production code and v2 validators never import the legacy segmenter.
- Every Word Forge/Blend Bridge phase names one real `wordId` and copies `getPronunciation(wordId).units.map(unit => unit.evidenceTargetId)` into `unitTargetIds`; do not infer units from printed spelling or box count. Validate matching printed-letter coverage and that every copied target was taught by that stop.
- A first-use power phase declares `onboarding: { consequenceFree: true, recordsDomain: null }` before any recordable decision.
- Review stops select only targets taught before the stop and do not relabel review as new teaching.
- Each authored controlled novel-decoding boss uses a real canonical controlled word by default and copies its reviewed unit metadata. Only a reviewed authored exception may introduce an imaginary name; that record declares `display`, `unitTargetIds`, `imaginary: true`, and `recordsDomain: "novel_decoding"`, and its unit IDs must be a subset of targets taught through that stop.
- Each payoff is a durable repair and relationship consequence, not currency-only celebration.

- [ ] **Step 4: Run focused campaign and legacy-regression checks**

Run:

```bash
node --test tests/unit/soundSeekersExpeditions.test.js tests/unit/soundSeekersReviewSequences.test.js tests/unit/soundSeekersPronunciationLexicon.test.js tests/unit/questSequence.test.js tests/unit/questBlueprint.test.js
npm run check:quest
```

Expected: PASS. At this stage `check:quest` remains a legacy regression gate; do not claim it validates v2 catalogs until Task 6 wires the aggregate checker.

- [ ] **Step 5: Commit the authored campaign**

```bash
git add -A -- src/features/soundSeekers/content/chapters src/features/soundSeekers/content/expeditions.js src/features/soundSeekers/content/reviewSequences.js tools/buildSoundSeekersPronunciationLexicon.mjs src/features/soundSeekers/content/pronunciationRecords.js src/features/soundSeekers/content/pronunciationCorpusInvariant.generated.js src/features/soundSeekers/content/pronunciationLexicon.js tests/unit/soundSeekersPronunciationLexicon.test.js tests/unit/soundSeekersExpeditions.test.js tests/unit/soundSeekersReviewSequences.test.js
git diff --cached --name-status
git commit -m "fix: complete Sound Seekers expedition contracts"
```

The scoped `git add -A -- ...` is deliberate: it stages a reviewed in-place replacement or deletion within the named review-authority paths as well as modifications and the new invariant. The cached list must contain no parallel `reviewTargetSource.js`, no unrelated file, and no unstaged replacement/deletion from this task.

### Task 2: Author the truthful 60-word deck, activity evidence, and merge-safe coverage

**Files:**
- Create: `src/features/soundSeekers/content/heartWordRecords.js`
- Create: `src/features/soundSeekers/content/heartWords.js`
- Create: `src/features/soundSeekers/content/contentDeckRecords.js`
- Create: `src/features/soundSeekers/content/contentDeckBindings.js`
- Create: `src/features/soundSeekers/content/contentDeckCatalogs.js`
- Create: `src/features/soundSeekers/engine/contentDeckState.js`
- Create: `src/features/soundSeekers/engine/contentDeckScheduler.js`
- Create: `src/features/soundSeekers/engine/contentDeckTransactions.js`
- Create: `src/features/soundSeekers/engine/contentCoverage.js`
- Verify unchanged: `src/features/soundSeekers/engine/challengeContract.js`
- Modify: `src/features/soundSeekers/engine/evidence.js`
- Modify: `src/features/soundSeekers/engine/evidenceEligibility.js`
- Modify: `src/features/soundSeekers/engine/stateV2.js`
- Create: `supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql`
- Create: `supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql`
- Create: `supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql`
- Create: `tools/runSoundSeekersContentDeckSqlSelftest.mjs`
- Create: `tests/unit/soundSeekersHeartWords.test.js`
- Create: `tests/unit/soundSeekersContentDecks.test.js`
- Create: `tests/unit/soundSeekersContentTransactions.test.js`
- Create: `tests/unit/soundSeekersContentCoverage.test.js`
- Create: `tests/unit/runSoundSeekersContentDeckSqlSelftest.test.js`
- Modify: `tests/unit/soundSeekersEvidence.test.js`
- Modify: `tests/unit/soundSeekersEvidenceEligibility.test.js`
- Modify: `tests/unit/soundSeekersStateV2.test.js`
- Modify: `tests/unit/progressMerge.test.js`

`heartWordRecords.js` and `contentDeckRecords.js` are pure authored sources that generators may import without importing generated pronunciation modules. `heartWords.js` validates high-frequency-word records and imports then re-exports the existing `HEART_WORD_ACTIVITY_TYPES` from `evidenceEligibility.js`; it must not declare a second list. `contentDeckBindings.js` is the sole structural binding and insertion-placement registry and validates both against Task 1 expeditions and the pure records. `contentDeckCatalogs.js` is the only runtime catalog registry. `contentDeckState.js` alone normalizes/checkpoints/resumes/merges persisted deck and receipt ledgers and exports raw structural visit/use projections; it never interprets correction history or decides whether a persisted identity exists in authored bindings/catalogs. `contentCoverage.js` owns the derived whole-state structural join across visits/uses, normalized evidence, and immutable attempt receipts; its `validAttemptReceipts(state)`, full-state `validContentDeckUses(state,category)`, and `deriveContentDeckRecordStats(state,category,recordId)` intentionally use no authored answer/catalog authority so their deterministic projection can match SQL and describe structurally sound but unauthorised raw records without awarding product coverage. Only `coverageStatus(state)` additionally uses scheduler rehydration to admit exact authored bindings/catalogs into product coverage. `contentDeckTransactions.js` alone owns durable placement/composite mutations, consumes the structural validators, rehydrates the canonical challenge, derives the real shared `nextCorrection()` ladder with the actual selected/intended tokens, appends each truthful decision event at the action boundary, and creates content uses only after every required current-target response is correct. `stateV2.js` imports the state-only module plus only the shared activity normalizer from `evidenceEligibility.js`; `contentDeckScheduler.js` imports the state-only module, bindings, and catalogs and owns canonical rehydration. `contentDeckState.js` imports only that shared activity normalizer among evidence-boundary code and must never import coverage, scheduler, transactions, bindings, catalogs, `challengeContract.js`, `evidence.js`, or `questCorrection.js`, preventing `stateV2 -> coverage/scheduler/transactions -> catalogs -> stateV2`. The one-way graph is `transactions -> coverage -> scheduler -> state`; no lower layer imports upward. Product coverage counts only whole-state-valid visit/use/receipt/evidence chains that also rehydrate against exact binding and catalog authorities; SQL and the structural JS projections never claim to validate an authored answer key.

**Interfaces:**
- Consumes: the exact unique 60-word membership of `QUEST_STOPS.flatMap(stop => stop.heartWords)`, Task 1 `SOUND_SEEKERS_EXPEDITIONS`, `CONTENT_DECK_SLOT_IDS`, `CONNECTED_TEXT_IDS`, `validateBoundContentDecisionSource()`, `resolveBoundContentDecision()`, pronunciation/meaning APIs, journey step, and v2 `contentDecks`.
- Consumes the committed foundation `getInstructionContract()`, `assertInstructionMatchesChallenge()`, `validateQuestChallenge()`, `toChildChallengeView()`, `createLiteracyDecision()`, `appendEvidence()`, `validateEvidencePath()`, and `bossNovelTargetId()`. `assertInstructionMatchesChallenge(getInstructionContract(challenge.instructionId), challenge)` is the existing and sole instruction/power/action/domain tuple authority; Task 2 must not reproduce that mapping. There is no committed morphology evidence domain or morphology target kind. Task 2 must not add one, reinterpret `suffix_s` as a GPC target, or report `word:cats` as morphology evidence.
- Consumes Task 1's exact heart binding `{actionUseId, category, contentInstanceId, isVisitOwner, requiredActivityType, slotId, visitOwnerId}`. `s6-heart-1` is the sole owner of `heart-slot-s6-1`, scheduled after `s6-teach`; `s6-primary` shares its instance/owner but has a distinct `actionUseId`. Task 2 may not schedule the shared action again or rewrite either activity.
- Produces `HEART_WORD_RECORDS`, `SOUND_SEEKERS_HEART_WORDS`, the imported/re-exported `HEART_WORD_ACTIVITY_TYPES`, `CONTENT_DECK_CATEGORIES`, `CONTENT_DECK_BINDINGS`, `CONTENT_DECK_PLACEMENTS`, `SOUND_SEEKERS_CONTENT_DECK_CATALOGS`, `getContentDeckCatalog(category)`, `getContentDeckCatalogRecord(category,recordId)`, `getContentDeckOwnerBinding(category,slotId)`, `getContentDeckActionBindings(category,contentInstanceId)`, `getContentDeckPlacements(stopId)`, `createContentDeckState(raw)`, `deriveContentDeckRecordStats(state,category,recordId)`, `rankContentDeckCandidates(records,deck,context)`, `serveContentDeck(contentDecks,{binding,visitId,stopId,journeyStep,seed})`, `rehydrateServedContentInstance(contentDecks,{category,visitId})`, `projectBoundContentResolverInputs(served)`, `recordContentDeckUse(contentDecks,served,binding)`, `beginContentPlacementAttempt(state,{placementId,visitId})`, `resumeContentPlacementAttempt(state,{placementId,visitId})`, `materializeContentPlacementChallenge(state,{placementId,visitId})`, `commitContentPlacementResponse(state,{placementId,visitId,challenge,response,audio,at,sessionDay})`, `completeContentPlacementCorrectionModel(state,{placementId,visitId})`, `beginStoryTransferTransaction(state,{stopId,journeyStep,seed})`, `checkpointStoryTransferTransaction(state,{transactionId,narrativeChoiceToken})`, `resumeStoryTransferTransaction(state,{transactionId})`, `materializeStoryTransferChallenge(state,{transactionId})`, `materializeBossTransferChallenge(state,{transactionId})`, `projectBossTransferOptionsForChild(state,{transactionId})`, `completeStoryTransferTransaction(state,{transactionId,challenge,response,audio,at,sessionDay})`, `completeStoryTransferCorrectionModel(state,{transactionId})`, `mergeContentDeckState(local,remote)`, `checkpointContentDecks(contentDecks)`, `resumeContentDecks(checkpoint)`, `validContentDeckVisits(contentDecks,category)`, `validAttemptReceipts(state)`, `validContentDeckUses(state,category)`, `coverageStatus(state)`, all five merge-safe categories, and the merge-safe answer-safe `state.attemptReceipts` ledger described below. Every API named `contentDecks` receives the complete normalized five-category object, never one category ledger; every API named `state` requires the complete normalized v2 state including evidence and attempt receipts.
- `coverageStatus(state)` returns exactly `{complete,categories}`, where `categories` has exactly the five canonical category keys and every value is exactly `{coveredRecordCount,totalRecordCount}`. Totals are frozen at `{heartWords:60,stories:40,alternatives:4,morphology:1,transfer:40}`. A record is covered only when at least one whole-state-valid use has a structurally valid parent visit, every declared dependent attempt receipt and evidence ID is non-conflict and referentially exact, and the visit/use rehydrates against the exact registered binding plus canonical catalog; repeated or shared uses count the record once. A structurally valid but unauthorised raw record may contribute to `deriveContentDeckRecordStats()` only when its full receipt/evidence chain is valid, but never to `coverageStatus()`. `complete` is true only when all five covered counts equal their totals.
- `getContentDeckCatalogRecord(category,recordId)` returns one frozen canonical full record. Every category record owns `recordId`, `category`, `contentId`, nullable `targetId`, nullable `wordId`, structural `slotIds`, and its named consumer contract. A heart catalog record has exactly `{answerTokensByActivity, category, contentId, display, eligibleActivityTypes, heartParts, introductionSlotId, introductionStopId, meaningId, pronunciationId, recordId, regularParts, slotIds, targetId, wordId}`; non-heart records use their category-specific exact schemas and never masquerade as Task 1 heart records. `targetId` is non-null for hearts, stories, and transfers; it is exactly `null` for alternative containers and the non-assessed morphology application. The full served heart instance copies the canonical identity and answer fields without mutation. `projectBoundContentResolverInputs()` is the sole adapter to Task 1's complete-object resolver contract.
- A full served instance is reducer-private. A heart instance contains exactly `{category, slotId, contentInstanceId, visitId, visitOwnerId, ownerActionUseId, stopId, journeyStep, recordId, contentId, targetId, wordId, eligibleActivityTypes, answerTokensByActivity, ownerActivityType, nextState}`. A non-heart instance contains exactly `{category, slotId, contentInstanceId, visitId, visitOwnerId, ownerActionUseId, stopId, journeyStep, recordId, contentId, targetId, wordId, nextState}`; its category-specific consumer data stays in the canonical catalog and registered binding. `nextState` is the normalized state containing the registered visit. Renderers receive neither full instance; heart renderers also never receive its answer map.
- `projectBoundContentResolverInputs(served)` accepts only a fully rehydrated heart instance, resolves its canonical record by `served.category` plus `served.recordId`, calls Task 1's exported `validateBoundContentDecisionSource()` over the two complete objects, and returns exactly this two-key source with no cloning, omission, or extra keys:

```js
{
  servedInstance: served,
  catalogRecord: getContentDeckCatalogRecord(served.category, served.recordId)
}
```

The rehydrated instance and canonical heart record must pass Task 1's exact-shape and exact-identity checks unchanged. `resolveBoundContentDecision(action, projectBoundContentResolverInputs(served))` remains the only heart-word answer-key resolver, and only its result plus a runtime `attemptId` may reach `toChildChallengeView()` and `createLiteracyDecision()`.
- `contentDeckBindings.js` re-exports the 81 Task 1 heart action bindings unchanged: 80 owners plus the shared `s6-primary` use. It also owns exactly 85 non-heart owner bindings, one per Task 1 structural slot. A non-heart binding contains exactly `{actionUseId, category, consumerId, contentInstanceId, isVisitOwner, slotId, visitOwnerId}`; `isVisitOwner` is always `true`, it has no `requiredActivityType`, `contentInstanceId` is `${category}-content-instance:${slotId}`, and `actionUseId` is `${visitOwnerId}:content-use`. Story owners are `sN-story`/`story_power`; alternative owners are the exact placement IDs below with `contrast_sort`; the morphology owner is the exact placement ID below with `word_forge`; transfer owners are the exact Task 1 `sN-transfer` actions with the transfer record's named power. Every category/slot/instance/owner/use/consumer tuple is unique and bijective with the Task 1 slot plus canonical record; runtime code may not invent a category/slot request or choose a consumer dynamically.
- `CONTENT_DECK_PLACEMENTS` contains exactly the following five frozen records and no story, transfer, or heart placement. Each record contains exactly `{afterPhaseId,category,challengeTargetIds,contentBinding,expectedAction,instructionId,masteryCredit,order,placementId,powerId,recordsDomain,slotId,stopId}`. `contentBinding` is object-identical to `getContentDeckOwnerBinding(category,slotId)`, `contentBinding.visitOwnerId === placementId`, and `order` is the one-based insertion order among additional subphases sharing `afterPhaseId`. `getContentDeckPlacements(stopId)` returns these records in `(afterPhaseId,order,placementId)` order without writing into or replacing `expedition.phases`; the existing Task 1 primary and secondary records retain their exact instruction/power/action/domain tuples.

| Placement ID | Slot | `afterPhaseId` / order | Challenge targets | Exact instruction / power / action / domain | Mastery credit |
|---|---|---|---|---|---|
| `s16-alternative` | `alternative-slot-s16` | `s16-teach` / `1` | `y_ie`, `y_ee` | `contrast-sort-place-sound` / `contrast_sort` / `place_sound_token` / `grapheme_to_phoneme` | `true` |
| `s28-alternative` | `alternative-slot-s28` | `s28-teach` / `1` | `oo_short` | `contrast-sort-place-sound` / `contrast_sort` / `place_sound_token` / `grapheme_to_phoneme` | `true` |
| `s29-alternative` | `alternative-slot-s29` | `s29-teach` / `1` | `ow_ou` | `contrast-sort-place-sound` / `contrast_sort` / `place_sound_token` / `grapheme_to_phoneme` | `true` |
| `s37-alternative` | `alternative-slot-s37` | `s37-teach` / `1` | `c_s`, `g_j`, `ch_k`, `ea_e` | `contrast-sort-place-sound` / `contrast_sort` / `place_sound_token` / `grapheme_to_phoneme` | `true` |
| `s38-morphology` | `morphology-slot-s38` | `s38-teach` / `1` | none | `morphology-teach` / `word_forge` / `introduce_word_ending` / `null` | `false` |

- `beginContentPlacementAttempt()` is the only placement-attempt creator. It rehydrates the registered owner visit, rejects an existing different pending placement, and persists `checkpoint.contentPlacement` exactly as `{kind:"content_placement",placementId,category,visitId,stopId,journeyStep,stage:"response_pending",targetOrdinal:0,attemptOrdinal:0,attemptId}`. The current action ID is `content-placement-attempt:${visitId}:${placementId}:${targetOrdinal}:${attemptOrdinal}`. It returns exactly `{nextState,attempt,challenge,correction}`, where `attempt` is `{attemptId,targetOrdinal,attemptOrdinal,supportLevel:0,revealed:false}`, `challenge` is the one current canonical challenge, and `correction` is `null`. `resumeContentPlacementAttempt()` validates that exact descriptor, rehydrates the registered placement/visit/catalog, reconstructs every prior correction only from `validAttemptReceipts(state)`, canonical evidence, fresh challenges, and `nextCorrection()`, and returns exactly `{attempt,challenge,served,correction}`. Neither API persists a served object, answer token, response, correctness flag, event, audio status, correction payload/ID, miss count, support level, reveal flag, selected token, or intended token.
- `materializeContentPlacementChallenge(state,{placementId,visitId})` accepts only the current canonical `response_pending` checkpoint and exposes one action at a time. At an alternative it returns the challenge for exact `challengeTargetIds[targetOrdinal]`, the Task 1 tuple above, one comparison-family private answer key, and no unrelated `wordId`; `toChildChallengeView()` removes the expected token. Its ID is `${attemptId}:challenge:${targetOrdinal}:${targetId}`. Earlier correct target ordinals remain visibly complete but cannot be answered or re-credited, and no later target appears before the current response commits. At s38 it returns the single child-visible application “Add s to cat.” with `recordsDomain:null`, no `targetId`, and no `expectedToken`; its only response is exactly `{challengeId,kind:"non-recording-complete",action:"introduce_word_ending"}`.
- `commitContentPlacementResponse()` is the only placement evidence/use mutation and returns exactly `{nextState,event,outcome,completed,correction}` for one child response, where `outcome` is `retry`, `model_required`, `next_challenge`, or `completed`. It rehydrates the checkpoint, deep-compares the supplied private `challenge` with a fresh canonical materialization, accepts one response/audio result, derives current support only by replaying the verified receipt/evidence history, and records one `createLiteracyDecision()` event immediately for that one alternative action. The first target attempt uses `{level:0,revealed:false}`. A wrong response atomically appends its event/receipt, calls `nextCorrection(previousCorrection,{selected,intended,targetId,domain,wordId,position,activityType,connectedTextId,bossTransferId,evidenceKind:"practice"})`, keeps the same `targetOrdinal`, and advances to a fresh attempt ID. Misses one/two return fresh attempts at support 1/2 and `outcome:"retry"`; the third persists only `stage:"model_pending"` at fresh `attemptOrdinal:3`, returns `outcome:"model_required"`; later misses retain level 3/revealed truth. The returned full frozen correction has deterministic ID `content-correction:${wrongAttemptId}`, but no correction/support/reveal/miss field is persisted. No wrong response creates a use or changes the target/options.
- `completeContentPlacementCorrectionModel(state,{placementId,visitId})` accepts no caller correction value. It accepts only the exact current third-miss `model_pending` descriptor, independently rederives the third wrong correction from the valid receipt/event chain, records no response/evidence/use/receipt, and changes only `stage` to `"response_pending"` without changing the already-fresh attempt ID. It returns exactly `{nextState,attempt,challenge,correction}` with the rematerialized current attempt/challenge at support 3/revealed true and the internally verified model-consumed correction. A call before the third miss, after consumption, on `response_pending`, or with a stale/cross-placement identity throws without mutation; model consumption is a one-time transition, not a retry-idempotent response commit. On every response attempt the commit reducer passes only the independently derived `{level:supportLevel,revealed}` to `createLiteracyDecision()`; `attemptOrdinal >= 3` is revealed only after the stage plus contiguous receipt history proves the one model was consumed, so a later correct answer never defaults to independent and the model never repeats.
- A correct alternative response appends its own event/receipt immediately. If another authored target remains, it persists `targetOrdinal + 1`, resets that target to `attemptOrdinal:0`, creates no use, and returns `outcome:"next_challenge",completed:false,correction:null`. Only a correct response at the final target atomically adds the one alternative use, whose `attemptReceiptIds` lists every committed response attempt for the placement in canonical target/attempt order, clears the checkpoint, and returns `outcome:"completed",completed:true`. Thus every action survives pause/reload while a later answer can never batch-credit an earlier target. At s38 the one valid non-recording response writes zero evidence, one receipt, and one exposure use carrying that receipt ID, then clears the checkpoint. Missing, extra, malformed, wrong-target, `model_pending`, stale-current, or identity-mismatched input throws before mutation. Repeating an already recorded attempt with its byte-equivalent normalized challenge/response/audio/derived-correction/time/session input returns the input state plus the existing event/result; divergent reuse fails closed, including zero-event s38. The morphology application never emits evidence for `suffix_s`, `word:cats`, or any pronunciation unit. A future assessed morphology domain/target contract is outside Task 2 and requires a separate foundation change.
- `serveContentDeck()` accepts only a registered owner binding. It registers exactly one immutable visit for a structural content instance at one `journeyStep`, returns the same full instance for an identical visit retry, and fails closed when a different visit claims the same instance and step or an immutable ID changes owner/record/content identity. A later replay with a new visit ID and a later journey step is valid. For a heart instance, it gathers every Task 1 binding sharing that `contentInstanceId` and filters to records eligible for the complete fixed activity set; the s6 owner therefore selects a record eligible for both `encoding` and `heart_part_mapping`. For a non-heart instance, the exact binding and its one structural catalog record are authoritative.
- `rehydrateServedContentInstance(contentDecks,{category,visitId})` first requires the visit to appear in `validContentDeckVisits(contentDecks,category)`, then resolves its registered binding and canonical catalog record and verifies exact equality for category, slot, content instance, visit ID, visit owner, owner action-use ID, stop, journey step, record, content, target, word, and the heart-only owner activity. It also revalidates slot ownership, the complete fixed activity eligibility, and the canonical answer-token keys. It returns a newly constructed full served instance with `nextState: contentDecks`; it returns `null` for a missing visit, conflict marker, structurally duplicated instance/step claim, orphaned owner, catalog/binding mismatch, or invalid activity. This scheduler-owned function, not `contentDeckState.js`, is the canonical binding/catalog gate. No caller may retain or serialize a served object across checkpoint/resume.
- `recordContentDeckUse()` is the public heart-use mutation only. It derives `useId` as `visitId + ":" + binding.actionUseId`, then rehydrates and verifies the instance from the supplied complete `contentDecks` before recording. It derives `activityType` only from `binding.requiredActivityType` and requires the canonical record to expose both that activity and its answer token. Only the owner binding must equal the visit's `ownerActivityType` and `ownerActionUseId`; a shared binding reuses the completed owner's visit and cannot create a second serve. The mutation rejects a shared use unless the exact owner `useId` already exists; merged validity is insertion-order independent and requires that owner entry to exist in the union. Every direct non-heart call is rejected: only the final `commitContentPlacementResponse()` may create an alternative or morphology use, and only `completeStoryTransferTransaction()` may create the story/transfer pair. All non-heart uses omit `activityType`.
- Each persisted category is `{visits:{}, uses:{}}`. A valid visit contains exactly `{kind:"visit",visitId,contentInstanceId,visitOwnerId,ownerActionUseId,category,slotId,recordId,contentId,targetId,wordId,stopId,journeyStep}` plus `ownerActivityType` only for `heartWords`; `targetId:null` is accepted only for `alternatives` and `morphology`. A heart use contains exactly `{kind:"use",useId,visitId,contentInstanceId,visitOwnerId,actionUseId,category,slotId,recordId,journeyStep,activityType}`. Every non-heart use instead contains those common fields without `activityType` plus nonempty ordered `attemptReceiptIds`. Story and transfer uses additionally contain exact `{transactionId,pairedUseId,evidenceEventId,narrativeChoiceToken}`; both records name the same transaction/final evidence/receipt chain, name one another reciprocally, and carry an equal nullable narrative token copied only from the checkpoint. Composite fields are forbidden on hearts/alternatives/morphology, and `attemptReceiptIds` is forbidden on hearts. Unknown fields are discarded before comparison.
- `state.attemptReceipts` is a separate answer-safe immutable ledger keyed by `attemptId`; it is not a sixth content-deck category and never enters child projection. A normalized receipt is exactly `{kind:"attempt_receipt",attemptId,operation,subjectId,decisionOrdinal,attemptOrdinal,inputSha256,completed,correctionRecordIds,eventIds,useIds}`. `operation` is `content_placement` or `story_transfer`; `subjectId` is the canonical placement or transaction ID; placement `decisionOrdinal` equals its target ordinal while story uses `0`; ordinals are nonnegative integers matching the attempt ID; `inputSha256` is 64 lowercase hex; `completed` is boolean; and all three frozen ID arrays are unique and canonically ordered. Each wrong response receipt names its one derived correction ID, one truthful event, and zero uses. Each non-final correct placement response names no correction, one truthful event, and zero uses. A final alternative receipt names its one event and final use; completed s38 has zero events plus its final use; a completed story receipt has its final event plus story/transfer use IDs in order. A receipt contains no response, audio, timestamp, answer/expected token, challenge, correction payload/rationale, support/reveal, or narrative token. Unknown fields are discarded. A same-ID divergent normalized receipt becomes exactly `{kind:"attempt_receipt_conflict",attemptId}` and that marker is absorbing.
- `contentDeckTransactions.js` contains one private synchronous browser-safe SHA-256 over recursively key-sorted canonical UTF-8 JSON; it does not use Node APIs, Web Crypto, a timestamp salt, object iteration order, or an async reducer. The exact placement input is `{schemaVersion:1,operation:"content_placement",subject:{placementId,visitId},attempt:{attemptId,decisionOrdinal,attemptOrdinal},correction:{supportLevel,revealed,modelStep},challenge,response,audio,at,sessionDay}`; the exact story input is the same shape with `subject:{transactionId}` and `decisionOrdinal:0`. The correction projection is independently rederived, never caller-supplied or persisted, and `modelStep` is `"not_required"`, `"pending"`, or `"consumed"`; challenges are freshly rematerialized private exact objects; response/audio are exact allowlisted normalized records; `at` is RFC 3339 UTC and `sessionDay` is `YYYY-MM-DD`. Tests import Node `createHash`, use a test-local recursive sorter, and literally construct representative first-wrong, supported-correct, s38, non-boss-private-key, and boss canonical inputs without calling or importing the browser canonicalizer/hash. `retryReceiptOracleCaseWithStoredReceiptSha()` is a test-only public-reducer fixture that replaces only the stored receipt digest with the independently computed mutant digest and proves canonical retry rejects the chain. The fixed oracle `{"a":"é","b":1}` must hash to `aa58fba8483623bed37c1b02edfccbdd9a53123837c20bfa4cb4049993a2872e`. Mutating s38 time, a non-boss private key, a correction field, or audio must produce a different oracle hash and fail closed. Before mutation each reducer validates challenge identity against fresh materialization. An exact retry revalidates its complete receipt/correction/evidence/use chain before returning byte-equivalent state and original result. After a cleared checkpoint, placement retry derives its attempt ID from the single `challengeId`; story retry uses `challenge.attemptId`; both rehydrate canonical identity without caller outcome data.
- Immutable-ID conflicts are absorbing and identical in JS and SQL. Reusing one `visitId`/`useId` with a different normalized payload yields its exact conflict marker; reusing an attempt ID with a different receipt yields its attempt conflict. Identical normalized payloads are idempotent, and all three unions are commutative, associative, and idempotent. `validContentDeckVisits(contentDecks,category)` remains the state-only visit projection. `validContentDeckUses(state,category)` requires the complete five-category ledger, normalized receipts, and normalized evidence. It excludes conflict/orphan/shared-before-owner/duplicate-claim uses and malformed reciprocal pairs as before, then requires every non-heart use's `attemptReceiptIds` to be the complete contiguous canonical chain for that exact visit/placement or transaction. Every listed receipt must be non-conflict, match operation/subject, and reference only existing non-conflict evidence/use IDs; every referenced event ID must equal its attempt prefix and occur once; the final receipt alone is `completed:true` and names that use (both use IDs for a composite); prior receipts are `completed:false` with zero uses; no unlisted receipt for that chain may exist. Alternative chains are ordered by target then attempt and prove every target finished correctly; story chains are ordered by attempt and prove only the last event correct; s38 proves its zero-event final receipt. Both composite halves require the identical chain. Thus any receipt/evidence/use conflict invalidates every dependent use and coverage result in JS and SQL; a later exact missing half may restore an orphan, but an absorbing conflict never can. These filters do not import authored catalogs; scheduler/transaction rehydration applies that separate canonical gate.
- Before fingerprinting, JS removes `ownerActivityType` and adds it back only for a `heartWords` visit when it is one of the exact four imported activities; a heart visit with an absent/invalid value becomes its visit-conflict marker. SQL performs that identical visit normalization. `activityType` follows the same pre-fingerprint rule for heart uses and evidence; it is omitted on every non-heart visit/use/event. The shared s6 instance records two explicit action uses but one visit. `firstServedStep`, `lastServedStep`, use count, activity counts, and activity recency are derived only from valid immutable uses; none is independently persisted or forward-merged.
- `contentDeckRecords.js` explicitly authors exactly 85 non-heart records. Stories use the exact ordered record IDs `story:scene-s1` through `story:scene-s40`, exact `contentId`/`connectedTextId` `scene-s1` through `scene-s40`, and exact evidence target `text:scene-sN`. Transfers use exact ordered record IDs/content IDs `transfer:s1` through `transfer:s40` and copy every Task 1 transfer action's instruction/power/action/domain identity. Every transfer retains `connectedTextId:"scene-sN"` as its story join and owns one recursively frozen reducer-private `decisionContract` exactly `{expectedToken,optionTokens}`. `optionTokens` contains exactly three opaque unique tokens in authored order and `expectedToken` equals exactly one member. The 32 non-boss contracts use the literal table below; a non-boss transfer otherwise owns `targetId:"text:scene-sN"`, null word/boss identity, and `bossDecision:null`. A boss transfer owns `targetId:bossNovelTargetId({wordId,bossTransferId:task1Transfer.contextId})`, `wordId`, `position:"whole"`, `bossTransferId:task1Transfer.contextId`, and one recursively frozen reducer-private `bossDecision` containing exactly `{expectedToken,options}`. `options` contains exactly three controlled-meaning records in authored order, each with exactly `{token,childText,semanticCue}`; its token projection and expected token equal `decisionContract` byte-for-byte. No decision contract, boss decision, expected token, or correctness marker enters a served instance. The four alternatives use exact record/content IDs `alternative:s16`, `alternative:s28`, `alternative:s29`, and `alternative:s37`, `targetId:null`, and the exact target lists in the placement table; each comparison family contains its private correct token and same-family distractor rationale. The sole morphology record uses `recordId:"morphology:s38:suffix_s"`, `contentId:"morphology:suffix_s:cats"`, `targetId:null`, `wordId:"cats"`, `morphologyId:"suffix_s"`, `assessed:false`, and `slotIds:["morphology-slot-s38"]`. It explicitly models base `cat` plus plural ending `s` producing `cats`/more than one, without entering the evidence target classifier. Do not invent `suffix_ing` or `suffix_ed` records for the one slot.

The 32 non-boss decision contracts are authored from this literal expected-position map, not calculated from stop number. For every listed stop, `optionTokens` is exactly [`ct-<stop>-a`, `ct-<stop>-b`, `ct-<stop>-c`] and the mapped letter selects the one expected token. Task 3 must attach its three meaningful child options to these three opaque tokens and prove its text-supported action is attached to the mapped token; it may not declare another key.

```js
const EXPECTED_NON_BOSS_TRANSFER_KEY_POSITIONS = Object.freeze({
  s1: "b", s2: "a", s3: "c", s4: "b",
  s6: "c", s7: "a", s8: "b", s9: "c",
  s11: "a", s12: "c", s13: "b", s14: "a",
  s16: "b", s17: "c", s18: "a", s19: "b",
  s21: "c", s22: "a", s23: "b", s24: "c",
  s26: "a", s27: "b", s28: "c", s29: "a",
  s31: "b", s32: "c", s33: "a", s34: "b",
  s36: "c", s37: "a", s38: "b", s39: "c"
});
```

The eight boss decisions are authored literally; `token` values never contain the word, meaning, correctness, or position. The expected-token positions intentionally vary, and presentation may reorder the three complete option records only through the later route-seeded child projection without changing their tokens or reducer key.

| Stop / word | Expected token | Three exact `token · childText · semanticCue` option records |
|---|---|---|
| `s5` / `cat` | `boss-s5-choice-b` | `boss-s5-choice-a` · “an animal that swims” · `swimming-animal`; `boss-s5-choice-b` · “a small pet animal” · `small-pet-animal`; `boss-s5-choice-c` · “an animal that flies” · `flying-animal` |
| `s10` / `thing` | `boss-s10-choice-c` | `boss-s10-choice-a` · “a person you meet” · `person-you-meet`; `boss-s10-choice-b` · “a place you visit” · `place-you-visit`; `boss-s10-choice-c` · “an object you use” · `object-you-use` |
| `s15` / `truck` | `boss-s15-choice-a` | `boss-s15-choice-a` · “a large road vehicle” · `goods-truck`; `boss-s15-choice-b` · “a small water vessel” · `small-boat`; `boss-s15-choice-c` · “a seat with a back” · `single-chair` |
| `s20` / `stone` | `boss-s20-choice-b` | `boss-s20-choice-a` · “water falling from clouds” · `falling-rain`; `boss-s20-choice-b` · “a hard piece of rock” · `hand-stone`; `boss-s20-choice-c` · “small round money” · `single-coin` |
| `s25` / `night` | `boss-s25-choice-c` | `boss-s25-choice-a` · “water falling from clouds” · `falling-rain`; `boss-s25-choice-b` · “the light time after morning” · `day-sky`; `boss-s25-choice-c` · “the dark time before morning” · `night-sky` |
| `s30` / `point` | `boss-s30-choice-a` | `boss-s30-choice-a` · “aim at one place” · `point-at-target`; `boss-s30-choice-b` · “strike your hands together” · `clap-hands`; `boss-s30-choice-c` · “rest on a seat” · `sit-on-seat` |
| `s35` / `near` | `boss-s35-choice-b` | `boss-s35-choice-a` · “a long distance away” · `far-object`; `boss-s35-choice-b` · “a short distance away” · `near-object`; `boss-s35-choice-c` · “the place where you live” · `home-place` |
| `s40` / `action` | `boss-s40-choice-c` | `boss-s40-choice-a` · “something you can hold” · `held-object`; `boss-s40-choice-b` · “somewhere you can go” · `destination-place`; `boss-s40-choice-c` · “something someone does” · `person-doing-action` |
- Category consumers are fixed now and tested again in the runtime plan:

| Deck category | Authored producer | Runtime consumer |
|---|---|---|
| `heartWords` | `heartWordRecords.js` + `heartWords.js` | `createMissionPlan.js` supplies `memoryDelivery.js`; all four activity types have distinct authored interaction contracts |
| `stories` | `contentDeckRecords.js` IDs, enriched/validated by Task 3 `connectedText.js` | `contentDeckTransactions.js` stages the story bridge before the paired transfer |
| `alternatives` | `contentDeckRecords.js` audited alternative records | `contentDeckTransactions.js` materializes the exact Contrast Sort placement challenges |
| `morphology` | `contentDeckRecords.js` exact non-assessed `suffix_s` / `cats` application | `contentDeckTransactions.js` supplies the placement's non-recording Word Forge presentation; no mastery consumer exists in this task |
| `transfer` | `contentDeckRecords.js` expedition transfer records | `contentDeckTransactions.js` commits the paired uses with the record's exact final power/domain, including authored bosses |

- Each stop has one composite story/transfer transaction. `beginStoryTransferTransaction()` derives `transactionId` as `story-transfer:${journeyStep}:${stopId}`, resolves the exact story and transfer owner bindings and records, and registers both visits before rendering: `visit:${transactionId}:story` and `visit:${transactionId}:transfer`. Their future use IDs are respectively `${storyVisitId}:${stopId}-story:content-use` and `${transferVisitId}:${stopId}-transfer:content-use`; all four IDs must be distinct. It returns exactly `{nextState,transaction}`, where the frozen reducer-private descriptor is `{kind:"story_transfer",transactionId,stopId,journeyStep,boss,storyVisitId,storyUseId,transferVisitId,transferUseId}` and contains no child answer key.
- The child first receives the story bridge, then the exact Task 1 transfer action. `checkpointStoryTransferTransaction()` may run only after the story bridge has been presented. It validates `narrativeChoiceToken` as exactly `null` at the 32 non-boss stops and a trimmed nonempty string at each of the eight bosses, then persists under `checkpoint.storyTransfer` exactly `{kind:"story_transfer",transactionId,stopId,journeyStep,stage:"response_pending",storyVisitId,transferVisitId,narrativeChoiceToken,attemptOrdinal:0,attemptId}`. The first ID is `story-transfer-attempt:${transactionId}:0`. It persists no served object, expected token, response, correctness flag, evidence payload, answer map, boss decision, correction/support/reveal/miss field, selected token, intended token, or catalog record. The boss narrative bridge is explicitly non-assessed and emits no evidence, but it is not consequence-free: Task 3 validates the token against the current scene's child-safe narrative options and maps it to one branch-specific persistent consequence/post-decision semantic. That token cannot alter the key, options, target, or scoring of the separately assessed boss challenge; Task 2 stores it unchanged through retries and copies it to both final uses so runtime can commit the authored branch consequence after success. `resumeStoryTransferTransaction()` structurally validates the descriptor, canonically rehydrates both visits/transfer record and all contiguous `validAttemptReceipts(state)`/evidence, rebuilds the same shared correction through `nextCorrection()`, and returns exactly `{transaction,storyServed,transferServed,attempt,correction}`, where `attempt` is `{attemptId,attemptOrdinal,supportLevel,revealed}`. It rejects a missing boss narrative token, a non-boss token, any structural/catalog/boss/correction mismatch, and never replays the completed story bridge.
- `materializeStoryTransferChallenge(state,{transactionId})` is the only transfer-challenge producer for all 40 stops. It resumes the canonical pending transaction and returns a recursively frozen reducer-private challenge with the persisted `attemptId`, deterministic `challengeId` `${attemptId}:transfer` for a non-boss or `${attemptId}:boss` for a boss, exact Task 1 instruction/power/action/domain and canonical evidence identities, plus the record's exact three `decisionContract.optionTokens`, one private `expectedToken`, and `requiresAudio:false`. Non-boss challenges carry `targetId:"text:scene-sN"`, `connectedTextId:"scene-sN"`, and no word/position/boss identity; boss challenges carry the canonical novel-decoding target/word/position/boss identity and `connectedTextId:null`. `materializeBossTransferChallenge()` delegates to that producer, requires one of the eight bosses, and returns the object-identical result without changing a field. `projectBossTransferOptionsForChild()` returns only the three equal-shape `{token,childText,semanticCue}` option records in canonical authored order; it returns no boss decision object, expected token, expected index, correctness marker, or field/shape discriminator. `toChildChallengeView(materializeStoryTransferChallenge(...))` contains all three tokens but no expected token at every stop. Task 3 and runtime tests must call this producer; a caller-authored non-boss key, singleton `optionTokens:[wordId]`, literal expected word token, or fabricated boss challenge is forbidden.
- `completeStoryTransferTransaction()` is the sole composite response reducer and returns exactly `{nextState,event,outcome,completed,correction}`, where `outcome` is `retry`, `model_required`, or `completed`. It accepts only `stage:"response_pending"`, rehydrates both visits/current attempt, verifies reciprocal future use IDs, validates the instruction/challenge tuple, and requires exact deep equality with fresh `materializeStoryTransferChallenge()` before scoring. It derives support/reveal only by replaying verified receipts/evidence and creates one truthful event. An incorrect response atomically appends event/receipt, calls the same `nextCorrection()` contract as placements, creates no use, and advances to fresh ID `story-transfer-attempt:${transactionId}:${attemptOrdinal + 1}` while preserving the narrative token. Misses one/two return `retry`; the third persists only `model_pending` and returns `model_required`; later attempts remain level 3/revealed. The full returned correction has deterministic ID `content-correction:${wrongAttemptId}` but is never persisted. Callers cannot submit support, reveal, miss count, correction, outcome, or completion.
- `completeStoryTransferCorrectionModel(state,{transactionId})` is the story counterpart and accepts no caller correction value: exact current third-miss `model_pending`, correction independently rederived from the third wrong receipt/event, zero response/evidence/use/receipt, one persisted change only to `stage:"response_pending"`, and exact return `{nextState,attempt,challenge,correction}` for the same already-fresh attempt at level 3/revealed true. A call before the third miss, after consumption, on `response_pending`, or with a stale/cross-transaction identity fails without mutation. Later attempt-four-or-greater corrections retain level 3/revealed truth and queue `nextCorrection().review`; they never reset or repeat the model.
- A correct response atomically appends its fresh event/receipt and both reciprocal uses with `narrativeChoiceToken` copied only from the checkpoint, stores the complete contiguous `attemptReceiptIds` chain on both uses, clears the checkpoint, and returns `outcome:"completed",completed:true,correction:null`. For the 32 non-boss stops each event is exactly `connected_text_transfer` with `targetId:"text:scene-sN"`, `connectedTextId:"scene-sN"`, and canonical `word:null`, `position:null`, and `bossTransferId:null`; both uses carry `narrativeChoiceToken:null`. For the eight boss stops each event is exactly `novel_decoding` with canonical boss target/word/position/context and `connectedTextId:null`; both uses carry the same nonempty checkpoint token. `activityType` is omitted entirely from every non-heart event. No story bridge calls `createLiteracyDecision()`.
- Before mutation the reducer constructs the exact current support/correction state, canonical input, receipt fingerprint, and candidate event. If that exact receipt already exists, an identical normalized retry returns the input state plus the existing referenced event/result/correction after revalidating the entire contiguous receipt/evidence/use chain; divergent private challenge or correction fields are detected even when they would derive the same event. Divergent reuse fails closed and cannot advance the checkpoint or create a use. Otherwise `challenge.attemptId` must equal the current persisted attempt. Missing, malformed, `model_pending`, stale-current, tuple-mismatched, boss-context-tampered, boss-answer-fabricated, receipt-conflicted, receipt-reference-invalid, or correction-divergent input throws with byte-equivalent input state. A later route pass receives a new journey-step transaction, two new visits, new attempt IDs/receipts, two new uses, and fresh evidence events.

- Checkpoint/resume retain the completed s6 owner visit/use when the app closes before the later shared `s6-primary` action. Older v2 saves may omit categories and `attemptReceipts`; the latter normalizes to `{}`. Unknown nested fields are stripped into exact records or conflict markers. `contentDeckState.js` performs structural normalization only: it retains a pending placement/story descriptor when its literal IDs/ordinals/stage and named structural visits agree, but it does not decide whether a stage is correction-history-authorized. Any persisted correction ID/payload, miss count, support, reveal, answer, response, or outcome field is stripped/rejected rather than trusted. Transaction-owned begin/resume/materialize/model/commit APIs canonically rehydrate bindings/catalogs/placements, replay the descriptor's non-conflict receipt/evidence history through `validAttemptReceipts(state)` and `nextCorrection()`, and reject every impossible stage/history pairing before exposing a challenge or mutating state. After exactly three valid misses, `model_pending` means the model is still owed and `response_pending` is the deliberately answer-neutral durable marker that the model transition was consumed; because those two states differ only by this trusted reducer-owned stage, persistence is not claimed to be cryptographic proof that pixels or audio were actually presented. Runtime/browser gates must separately prove that production can reach the latter only after rendering the model step. `stateV2.js` delegates deck/receipt/checkpoint structural normalization/merge to `contentDeckState.js` and never imports scheduler, transactions, correction, bindings, or catalogs.
- `evidenceEligibility.js` owns the JS activity normalizer. The existing child challenge allowlist already contains `activityType`; Task 2 verifies rather than re-adds it. `validateQuestChallenge()` plus `validateEvidencePath()` must accept exactly one imported subtype for a `heart_word_mapping` target and reject missing/invalid heart subtypes or any subtype on another domain. Before evidence ID grouping, normalization trims/retains `activityType` only when the domain is `heart_word_mapping` and the value is one of the exact four types; it deletes the property for non-heart and invalid-heart events. `createLiteracyDecision()` omits the property entirely on non-heart evidence while retaining the existing canonical nulls for `word`, `position`, `connectedTextId`, and `bossTransferId` when they do not apply. SQL applies the identical normalization before grouping by ID, preventing null/blank/extra non-heart activity values from creating false conflicts.
- The new forward migration follows but never edits `20260901120000_sound_seekers_learning_v2.sql`. It defines exactly `lp_quest_normalize_v2_deck_visit(category text,entry_id text,value jsonb) returns jsonb`, `lp_quest_normalize_v2_deck_use(category text,entry_id text,value jsonb) returns jsonb`, `lp_quest_union_v2_deck_visits(category text,left_visits jsonb,right_visits jsonb) returns jsonb`, `lp_quest_union_v2_deck_uses(category text,left_uses jsonb,right_uses jsonb) returns jsonb`, `lp_quest_merge_v2_deck(category text,left_deck jsonb,right_deck jsonb) returns jsonb`, `lp_quest_merge_v2_content_decks(left jsonb,right jsonb) returns jsonb`, `lp_quest_normalize_v2_attempt_receipt(entry_id text,value jsonb) returns jsonb`, `lp_quest_union_v2_attempt_receipts(left_receipts jsonb,right_receipts jsonb) returns jsonb`, non-persisted `lp_quest_valid_v2_attempt_receipts(evidence jsonb,content_decks jsonb,attempt_receipts jsonb) returns jsonb`, and non-persisted `lp_quest_valid_v2_content_decks(content_decks jsonb,attempt_receipts jsonb,evidence jsonb) returns jsonb`. Category normalizers enforce exact outer category and non-heart `attemptReceiptIds`; receipt normalization enforces exact schema/ordinals/hash/three arrays. Raw merge preserves repairable orphans. The receipt projection uses the structural deck projection, normalized evidence, unique event/use ownership, exact attempt/event IDs, contiguous ordinals, support/reveal ladder, and operation-specific result shapes; dangling receipts remain raw but invalid until missing dependencies arrive, while conflicts never recover. The final deck projection retains heart structural validity and filters every non-heart use through those valid receipts. Both return deterministic JSON and never enter persisted state. Overall merge calls only raw unions. Preserve all foundation behavior/signatures/revokes/grants; new helpers receive the same boundary.
- `sound_seekers_v2_content_deck_local_bootstrap.sql` is the only database bootstrap for the direct gate. It is idempotent inside a newly initialized, exclusive cluster: create `anon` and `authenticated` as `NOLOGIN` roles only when absent, then create `public.student_progress` with exactly the columns needed by the selected prerequisite trigger migration: `id bigint generated always as identity primary key`, `student_id uuid not null`, `area text not null`, `key text not null`, `payload jsonb not null`, `updated_at timestamptz not null default now()`, and `unique(student_id,area,key)`. It creates no `auth` schema, learner, teacher, production row, network listener, extension, or substitute merge function. The direct chain is the bootstrap followed by exactly `20260614090000_progress_forward_merge.sql`, `20260715090000_phonics_quest_merge.sql`, `20260901120000_sound_seekers_learning_v2.sql`, `20260901143000_sound_seekers_v2_content_deck_merge.sql`, and `sound_seekers_v2_content_deck_merge_selftest.sql`; discovery or execution of any other migration is forbidden.
- `tools/runSoundSeekersContentDeckSqlSelftest.mjs` is the sole direct SQL gate and never connects to an existing database. It exports frozen `SOUND_SEEKERS_CONTENT_DECK_SQL_FILES` in the exact order above plus pure/injectable `assertNoSqlSelftestCliArguments(args)`, `sanitizedPostgresEnvironment(env)`, `runSoundSeekersContentDeckSqlSelftest({args,env,runCommand,randomBytes,mkdtemp,mkdir,remove,tmpdir,stdout,stderr})`, and `soundSeekersContentDeckSqlSelftestMain({argv,env,run,stdout,stderr})`. It accepts no URL, database, host, port, user, service, or options argument/environment setting. Every positional/option CLI argument is rejected. `SOUND_SEEKERS_LOCAL_POSTGRES_ADMIN_URL`, `SOUND_SEEKERS_TEST_DATABASE_URL`, and `DATABASE_URL` are deleted, never parsed, and never reach a command. The subprocess environment starts from the supplied environment for `PATH` and platform essentials but deletes those three URL variables **and every inherited key whose name starts with `PG`**, including `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSERVICE`, `PGSERVICEFILE`, `PGOPTIONS`, `PGCLIENTENCODING`, `PGDATESTYLE`, `PGTZ`, `PGSSLMODE`, and `PGPASSFILE`; every PostgreSQL target is instead supplied by explicit argument array. `runCommand(binary,args,{env})` never uses a shell and returns `{status,stdout,stderr,error?}`. A null or nonzero status is always a hard failure except an `ENOENT` from one of the five preflight probes. A thrown probe error, a probe `status:null` without `ENOENT`, or a probe nonzero status is a redacted hard failure, never a blocked result.
- Before any filesystem or database mutation, probe `initdb`, `pg_ctl`, `psql`, `createdb`, and `dropdb` with `--version`. Then call injected `mkdtemp()` with exactly `join(tmpdir(),"lp-ss-")` to create one root matching `lp-ss-[A-Za-z0-9_-]+`; its only owned descendants are the deliberately short `d` data directory and `s` socket directory. Enter the cleanup-protected region immediately after the root is returned and before `mkdir`, `initdb`, or `pg_ctl start`. Initialize with `initdb -D <d> --auth=trust --username=postgres --no-locale --encoding=UTF8`. Choose a cryptographically derived port in `20000..60999`, compute the longest pathname PostgreSQL will create as `<s>/.s.PGSQL.<port>.lock`, and fail before `initdb` unless `Buffer.byteLength(longestPath,"utf8") <= 103` (Darwin's 104-byte `sun_path`, including its terminating NUL). Then start with `pg_ctl -D <d> -w -o "-k <s> -p <port> -c listen_addresses='' -c unix_socket_permissions=0700" start`; the cluster exposes only its unique Unix socket. Generate the test database name from a separate 12 random bytes as `literacypath_sound_seekers_test_[0-9a-f]{24}` and create it with explicit `-h <s> -p <port> -U postgres`. Every file in `SOUND_SEEKERS_CONTENT_DECK_SQL_FILES` runs against that exact database as `psql -X --set=ON_ERROR_STOP=1 -h <s> -p <port> -U postgres -d <database> -f <file>`. No command may depend on `.psqlrc`, libpq environment discovery, TCP, an existing cluster, or caller credentials.
- Cleanup tracks attempts, not only successful returns. After any `createdb` attempt it first uses socket-bound `psql` against `postgres` with a bound `database_name` variable to terminate only that generated database and then calls socket-bound `dropdb --if-exists`. After any start attempt it calls `pg_ctl -D <d> -m immediate -w stop`. Finally it calls injected `remove(root,{recursive:true,force:true})` only after proving the resolved root still matches its exact `lp-ss-` generated prefix and both owned descendants remain beneath it. Termination, drop, stop, and removal are each attempted even when an earlier cleanup step fails. A primary init/start/create/migration/self-test failure remains the thrown primary error with redacted cleanup details attached; multiple cleanup errors never replace it. With no primary failure, any cleanup error is the hard failure. Command errors expose only binary, stage, and redacted status; they never include environment values, temp paths, socket paths, database names, stdout, or stderr.
- The runner returns `{status:"passed"}` and prints exactly `PASS: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST` only after the self-test, database termination/drop, cluster stop, and root removal all succeed. A missing required binary prints exactly `BLOCKED: SQL_DIRECT_GATE_UNAVAILABLE`, performs no `mkdtemp`, `mkdir`, init/start/create/SQL/cleanup mutation, returns `{status:"blocked",reason:"SQL_DIRECT_GATE_UNAVAILABLE"}`, and the CLI exits `2`. `soundSeekersContentDeckSqlSelftestMain()` maps passed to `0`, only that blocked result to `2`, and invalid input or every filesystem, command, SQL, or cleanup failure to `1`; it emits one redacted `ERROR: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST_FAILED` line for hard failure and never relabels it blocked or passed.
- Canonical record:

```js
{
  recordId: "hw:a",
  category: "heartWords",
  contentId: "heart-word:a",
  targetId: "hw:a",
  wordId: "a",
  display: "a",
  pronunciationId: "a",
  meaningId: "a-meaning",
  regularParts: [],
  heartParts: [0],
  introductionStopId: "s1",
  introductionSlotId: "heart-slot-s1-1",
  slotIds: ["heart-slot-s1-1"],
  eligibleActivityTypes: HEART_WORD_ACTIVITY_TYPES,
  answerTokensByActivity: {
    recognition: "hw:a:recognition",
    heart_part_mapping: "hw:a:heart-part:0",
    encoding: "hw:a:encoding",
    sentence_use: "hw:a:sentence-use"
  }
}
```

`regularParts` and `heartParts` contain canonical pronunciation-unit indices, not duplicated grapheme/sound-key records. `HEART_WORD_ACTIVITY_TYPES` is the canonical universe, but an individual record includes `heart_part_mapping` in `eligibleActivityTypes` and `answerTokensByActivity` only when `heartParts.length > 0`; the other three activities remain eligible. A structural mapping slot may introduce or review only a record with a canonical heart part.

The introduction schedule is independent of legacy stop arrays and equals this table. Only `a` moves earlier than its legacy declaration; every other word stays at or after it. Table order maps to heart slot 1 then 2. Stops omitted here introduce none and use their two slots for review.

| Stop | New heart words |
|---|---|
| s1 | a |
| s3 | I, the |
| s4 | is |
| s5 | to, go |
| s6 | my, and |
| s7 | he, she |
| s8 | we, me |
| s9 | be, was |
| s10 | no, you |
| s11 | they, all |
| s12 | her, are |
| s13 | said, so |
| s14 | have, like |
| s15 | some, come |
| s16 | were, there |
| s17 | little, one |
| s18 | do, when |
| s19 | out, what |
| s20 | oh, their |
| s21 | people, called |
| s22 | looked, asked |
| s23 | your, water |
| s24 | where, who |
| s25 | again, thought |
| s26 | through, work |
| s27 | any, many |
| s28 | laughed, because |
| s29 | different, eyes |
| s30 | friends, once |
| s31 | please, could |
| s32 | would, should |

- [ ] **Step 1: Write failing mapping, schedule, evidence, and merge tests**

Place each test in the named focused file from the Files list. In `soundSeekersContentDecks.test.js`, import `* as espree` from the installed `espree` package and import `basename`, `dirname`, `extname`, and `resolve` from `node:path` plus `readFileSync` and `realpathSync` from `node:fs`; do not write a second parser. In `runSoundSeekersContentDeckSqlSelftest.test.js`, import `join` from `node:path` and define the injected `createEphemeralPostgresFailureHarness()` exactly as specified in Step 3 so no test starts a real process. The actual zero-input runner invocation remains the separate Step 4 direct gate.

```js
test("the canonical sixty words are partitioned truthfully", () => {
  const declared = new Set(QUEST_STOPS.flatMap(stop => stop.heartWords.map(word => word.toLowerCase())));
  assert.strictEqual(HEART_WORD_ACTIVITY_TYPES, EVIDENCE_HEART_WORD_ACTIVITY_TYPES);
  assert.equal(declared.size, 60);
  assert.equal(SOUND_SEEKERS_HEART_WORDS.length, 60);
  assert.deepEqual(new Set(SOUND_SEEKERS_HEART_WORDS.map(item => item.display.toLowerCase())), declared);

  for (const record of SOUND_SEEKERS_HEART_WORDS) {
    const pronunciation = getPronunciation(record.pronunciationId);
    assert.ok(pronunciation, record.recordId);
    assert.equal(record.meaningId, pronunciation.meaningId);
    assert.ok(record.regularParts.length + record.heartParts.length > 0, record.recordId);
    assert.equal(new Set([...record.regularParts, ...record.heartParts]).size, pronunciation.units.length, record.recordId);
    assert.deepEqual(
      [...record.regularParts, ...record.heartParts].sort((a, b) => a - b),
      pronunciation.units.map((_, index) => index)
    );
    assert.equal(record.heartParts.every(index => pronunciation.units[index].role === "irregular"), true, record.recordId);
    assert.equal(record.regularParts.every(index => pronunciation.units[index].role !== "irregular"), true, record.recordId);
  }
  assert.equal(SOUND_SEEKERS_HEART_WORDS.find(item => item.recordId === "hw:a").regularParts.length, 0);
  assert.equal(SOUND_SEEKERS_HEART_WORDS.find(item => item.recordId === "hw:and").heartParts.length, 0);
});

test("the independent introduction schedule is exact, structural, and capped at two", () => {
  assert.deepEqual(heartIntroductionWordsByStop(), EXPECTED_HEART_INTRODUCTION_SCHEDULE);
  assert.deepEqual(heartIntroductionWordsByStop().s1, ["a"]);
  for (const stop of QUEST_STOPS) {
    const introduced = SOUND_SEEKERS_HEART_WORDS.filter(item => item.introductionStopId === stop.id);
    assert.ok(introduced.length <= 2, stop.id);
    for (const [index, record] of introduced.entries()) {
      assert.equal(record.introductionSlotId, `heart-slot-${stop.id}-${index + 1}`);
      const opportunity = getExpedition(stop.id).heartWordOpportunities[index];
      if (opportunity.contentBinding.requiredActivityType === "heart_part_mapping") {
        assert.ok(record.heartParts.length > 0, `${record.recordId}: mapping introduction needs a heart part`);
      }
    }
  }
});

test("one owner visit per structural heart slot covers all sixty and every fixed activity", () => {
  let decks = createContentDeckState();
  const served = new Set();
  const activities = new Set();
  const visits = new Set();
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    for (const opportunity of expedition.heartWordOpportunities) {
      const result = serveContentDeck(decks, {
        binding: opportunity.contentBinding,
        visitId: `journey-1:${opportunity.contentBinding.visitOwnerId}`,
        stopId: expedition.stopId,
        journeyStep: expedition.stopIndex,
        seed: expedition.stopIndex
      });
      assert.ok(result, opportunity.id);
      assert.equal(result.ownerActivityType, opportunity.contentBinding.requiredActivityType);
      assert.ok(result.eligibleActivityTypes.includes(result.ownerActivityType));
      served.add(result.recordId);
      activities.add(result.ownerActivityType);
      visits.add(result.visitId);
      decks = recordContentDeckUse(result.nextState, result, opportunity.contentBinding);
    }
  }
  assert.equal(visits.size, 80);
  assert.equal(served.size, 60);
  assert.deepEqual(activities, new Set(HEART_WORD_ACTIVITY_TYPES));
});

test("one thousand fresh route seeds preserve introductions, mapping eligibility, and stable ranking", () => {
  const stopIndexById = new Map(SOUND_SEEKERS_EXPEDITIONS.map(expedition => [
    expedition.stopId, expedition.stopIndex
  ]));
  const canonicalHeartRecords = getContentDeckCatalog("heartWords");

  for (let seed = 0; seed < 1_000; seed += 1) {
    let contentDecks = createContentDeckState();
    const firstServeByRecordId = new Map();
    const activities = new Set();

    for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
      for (const opportunity of expedition.heartWordOpportunities) {
        const requiredActivityTypes = [...new Set(getContentDeckActionBindings(
          "heartWords", opportunity.contentBinding.contentInstanceId
        ).map(binding => binding.requiredActivityType))].sort();
        const candidates = canonicalHeartRecords.filter(record =>
          stopIndexById.get(record.introductionStopId) <= expedition.stopIndex
          && requiredActivityTypes.every(activity => record.eligibleActivityTypes.includes(activity)));
        const rankContext = {
          category: "heartWords",
          slotId: opportunity.contentBinding.slotId,
          journeyStep: expedition.stopIndex,
          requiredActivityTypes,
          seed
        };
        assert.deepEqual(
          rankContentDeckCandidates(candidates, contentDecks, rankContext).map(record => record.recordId),
          rankContentDeckCandidates([...candidates].reverse(), contentDecks, rankContext)
            .map(record => record.recordId),
          `seed ${seed} ${opportunity.id}: input order changed ranking`
        );

        const served = serveContentDeck(contentDecks, {
          binding: opportunity.contentBinding,
          visitId: `seed-${seed}:${opportunity.contentBinding.visitOwnerId}`,
          stopId: expedition.stopId,
          journeyStep: expedition.stopIndex,
          seed
        });
        const record = getContentDeckCatalogRecord("heartWords", served.recordId);
        if (!firstServeByRecordId.has(record.recordId)) {
          firstServeByRecordId.set(record.recordId, {
            stopId: expedition.stopId,
            slotId: opportunity.contentBinding.slotId
          });
          assert.deepEqual(firstServeByRecordId.get(record.recordId), {
            stopId: record.introductionStopId,
            slotId: record.introductionSlotId
          }, `seed ${seed} ${record.recordId}: first serve must be its authored introduction`);
        }
        if (opportunity.contentBinding.requiredActivityType === "heart_part_mapping") {
          assert.ok(record.heartParts.length > 0,
            `seed ${seed} ${opportunity.id}: mapping selected a regular-only record`);
        }
        activities.add(opportunity.contentBinding.requiredActivityType);
        contentDecks = recordContentDeckUse(
          served.nextState, served, opportunity.contentBinding
        );
      }
    }

    assert.equal(validContentDeckVisits(contentDecks, "heartWords").length, 80, `seed ${seed}`);
    assert.equal(firstServeByRecordId.size, 60, `seed ${seed}`);
    assert.deepEqual(new Set(firstServeByRecordId.keys()),
      new Set(canonicalHeartRecords.map(record => record.recordId)), `seed ${seed}`);
    assert.deepEqual(activities, new Set(HEART_WORD_ACTIVITY_TYPES), `seed ${seed}`);
  }
});

test("the five authored catalogs have exact structural counts and ownership", () => {
  assert.deepEqual(CONTENT_DECK_CATEGORIES, [
    "heartWords", "stories", "alternatives", "morphology", "transfer"
  ]);
  assert.deepEqual(Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [
    category, getContentDeckCatalog(category).length
  ])), { heartWords: 60, stories: 40, alternatives: 4, morphology: 1, transfer: 40 });
  for (const category of ["stories", "alternatives", "morphology", "transfer"]) {
    assertCategorySlotsAreBijective(category, CONTENT_DECK_SLOT_IDS[category]);
  }
  const morphology = getContentDeckCatalog("morphology")[0];
  assert.deepEqual(
    {
      recordId: morphology.recordId,
      contentId: morphology.contentId,
      targetId: morphology.targetId,
      wordId: morphology.wordId,
      morphologyId: morphology.morphologyId,
      assessed: morphology.assessed,
      slotIds: morphology.slotIds
    },
    {
      recordId: "morphology:s38:suffix_s",
      contentId: "morphology:suffix_s:cats",
      targetId: null,
      wordId: "cats",
      morphologyId: "suffix_s",
      assessed: false,
      slotIds: ["morphology-slot-s38"]
    }
  );

  assert.deepEqual(
    getContentDeckCatalog("stories").map(record => record.recordId),
    Array.from({ length: 40 }, (_, index) => `story:scene-s${index + 1}`)
  );
  assert.deepEqual(
    getContentDeckCatalog("transfer").map(record => record.recordId),
    Array.from({ length: 40 }, (_, index) => `transfer:s${index + 1}`)
  );

  const ownerBindings = CONTENT_DECK_BINDINGS.filter(binding => binding.isVisitOwner);
  assert.deepEqual(Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [
    category, ownerBindings.filter(binding => binding.category === category).length
  ])), { heartWords: 80, stories: 40, alternatives: 4, morphology: 1, transfer: 40 });
  assert.equal(CONTENT_DECK_BINDINGS.filter(binding => binding.category === "heartWords").length, 81);

  for (const binding of ownerBindings.filter(item => item.category !== "heartWords")) {
    assert.deepEqual(Object.keys(binding).sort(), [
      "actionUseId", "category", "consumerId", "contentInstanceId",
      "isVisitOwner", "slotId", "visitOwnerId"
    ]);
    assert.equal(binding.contentInstanceId, `${binding.category}-content-instance:${binding.slotId}`);
    assert.equal(binding.actionUseId, `${binding.visitOwnerId}:content-use`);
    assert.strictEqual(getContentDeckOwnerBinding(binding.category, binding.slotId), binding);
  }
  assert.deepEqual(new Set(ownerBindings.filter(item => item.category === "stories").map(item => item.consumerId)), new Set(["story_power"]));
  assert.deepEqual(new Set(ownerBindings.filter(item => item.category === "alternatives").map(item => item.consumerId)), new Set(["contrast_sort"]));
  assert.deepEqual(new Set(ownerBindings.filter(item => item.category === "morphology").map(item => item.consumerId)), new Set(["word_forge"]));

  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const stopId = expedition.stopId;
    const storySlot = `story-slot-${stopId}`;
    assert.deepEqual(getContentDeckOwnerBinding("stories", storySlot), {
      actionUseId: `${stopId}-story:content-use`, category: "stories", consumerId: "story_power",
      contentInstanceId: `stories-content-instance:${storySlot}`, isVisitOwner: true,
      slotId: storySlot, visitOwnerId: `${stopId}-story`
    });
    for (const slotId of expedition.contentDeckSlotIds.alternatives) {
      assert.deepEqual(getContentDeckOwnerBinding("alternatives", slotId), {
        actionUseId: `${stopId}-alternative:content-use`, category: "alternatives", consumerId: "contrast_sort",
        contentInstanceId: `alternatives-content-instance:${slotId}`, isVisitOwner: true,
        slotId, visitOwnerId: `${stopId}-alternative`
      });
    }
    for (const slotId of expedition.contentDeckSlotIds.morphology) {
      assert.deepEqual(getContentDeckOwnerBinding("morphology", slotId), {
        actionUseId: `${stopId}-morphology:content-use`, category: "morphology", consumerId: "word_forge",
        contentInstanceId: `morphology-content-instance:${slotId}`, isVisitOwner: true,
        slotId, visitOwnerId: `${stopId}-morphology`
      });
    }
    const transfer = expedition.phases.find(phase => phase.id === `${stopId}-transfer`);
    const transferSlot = `transfer-slot-${stopId}`;
    assert.deepEqual(getContentDeckCatalogRecord("stories", `story:scene-${stopId}`), {
      recordId: `story:scene-${stopId}`,
      category: "stories",
      contentId: `scene-${stopId}`,
      targetId: `text:scene-${stopId}`,
      wordId: null,
      connectedTextId: `scene-${stopId}`,
      slotIds: [storySlot]
    });
    const transferRecord = getContentDeckCatalogRecord("transfer", `transfer:${stopId}`);
    assert.deepEqual({
      recordId: transferRecord.recordId,
      contentId: transferRecord.contentId,
      instructionId: transferRecord.instructionId,
      powerId: transferRecord.powerId,
      expectedAction: transferRecord.expectedAction,
      recordsDomain: transferRecord.recordsDomain,
      connectedTextId: transferRecord.connectedTextId,
      wordId: transferRecord.wordId,
      bossTransferId: transferRecord.bossTransferId,
      targetId: transferRecord.targetId
    }, {
      recordId: `transfer:${stopId}`,
      contentId: `transfer:${stopId}`,
      instructionId: transfer.instructionId,
      powerId: transfer.powerId,
      expectedAction: transfer.expectedAction,
      recordsDomain: transfer.recordsDomain,
      connectedTextId: expedition.connectedTextId,
      wordId: transfer.wordId ?? null,
      bossTransferId: expedition.transfer.boss ? transfer.contextId : null,
      targetId: expedition.transfer.boss
        ? bossNovelTargetId({ wordId: transfer.wordId, bossTransferId: transfer.contextId })
        : `text:${expedition.connectedTextId}`
    });
    assert.deepEqual(getContentDeckOwnerBinding("transfer", transferSlot), {
      actionUseId: `${transfer.id}:content-use`, category: "transfer", consumerId: transfer.powerId,
      contentInstanceId: `transfer-content-instance:${transferSlot}`, isVisitOwner: true,
      slotId: transferSlot, visitOwnerId: transfer.id
    });
  }
});

const TASK2_RUNTIME_MODULES = Object.freeze({
  heartWordRecords: "src/features/soundSeekers/content/heartWordRecords.js",
  heartWords: "src/features/soundSeekers/content/heartWords.js",
  contentDeckRecords: "src/features/soundSeekers/content/contentDeckRecords.js",
  contentDeckBindings: "src/features/soundSeekers/content/contentDeckBindings.js",
  contentDeckCatalogs: "src/features/soundSeekers/content/contentDeckCatalogs.js",
  contentDeckState: "src/features/soundSeekers/engine/contentDeckState.js",
  contentDeckScheduler: "src/features/soundSeekers/engine/contentDeckScheduler.js",
  contentDeckTransactions: "src/features/soundSeekers/engine/contentDeckTransactions.js",
  contentCoverage: "src/features/soundSeekers/engine/contentCoverage.js",
  challengeContract: "src/features/soundSeekers/engine/challengeContract.js",
  evidence: "src/features/soundSeekers/engine/evidence.js",
  evidenceEligibility: "src/features/soundSeekers/engine/evidenceEligibility.js",
  stateV2: "src/features/soundSeekers/engine/stateV2.js"
});

const TASK2_ALLOWED_IMPORT_EDGES = Object.freeze([
  "challengeContract->evidenceEligibility",
  "contentCoverage->contentDeckBindings",
  "contentCoverage->contentDeckCatalogs",
  "contentCoverage->contentDeckScheduler",
  "contentCoverage->contentDeckState",
  "contentDeckBindings->contentDeckRecords",
  "contentDeckBindings->expeditions",
  "contentDeckBindings->heartWordRecords",
  "contentDeckCatalogs->contentDeckRecords",
  "contentDeckCatalogs->heartWords",
  "contentDeckScheduler->contentDeckBindings",
  "contentDeckScheduler->contentDeckCatalogs",
  "contentDeckScheduler->contentDeckState",
  "contentDeckState->evidenceEligibility",
  "contentDeckTransactions->challengeContract",
  "contentDeckTransactions->contentDeckBindings",
  "contentDeckTransactions->contentDeckCatalogs",
  "contentDeckTransactions->contentCoverage",
  "contentDeckTransactions->contentDeckScheduler",
  "contentDeckTransactions->contentDeckState",
  "contentDeckTransactions->evidence",
  "contentDeckTransactions->evidenceEligibility",
  "contentDeckTransactions->expeditions",
  "contentDeckTransactions->instructionContracts",
  "contentDeckTransactions->questCorrection",
  "evidence->challengeContract",
  "evidence->evidenceEligibility",
  "heartWords->evidenceEligibility",
  "heartWords->heartWordRecords",
  "heartWords->pronunciationLexicon",
  "stateV2->contentDeckState",
  "stateV2->evidenceEligibility"
]);

const TASK2_EXTERNAL_IMPORT_TARGETS = Object.freeze({
  expeditions: "src/features/soundSeekers/content/expeditions.js",
  instructionContracts: "src/features/soundSeekers/content/instructionContracts.js",
  pronunciationLexicon: "src/features/soundSeekers/content/pronunciationLexicon.js",
  questCorrection: "src/utils/questCorrection.js"
});

function assertTask2ImportGraph({ sourceOverrides = new Map(), allowedEdges = TASK2_ALLOWED_IMPORT_EDGES } = {}) {
  const repositoryRoot = realpathSync(resolve("."));
  const namedPaths = new Map(Object.entries({
    ...TASK2_RUNTIME_MODULES,
    ...TASK2_EXTERNAL_IMPORT_TARGETS
  }).map(([name, file]) => [realpathSync(resolve(file)), name]));
  const taskPathByName = new Map(Object.entries(TASK2_RUNTIME_MODULES)
    .map(([name, file]) => [name, realpathSync(resolve(file))]));
  const edges = new Set();

  for (const [sourceName, sourcePath] of taskPathByName) {
    const source = sourceOverrides.get(sourceName) ?? readFileSync(sourcePath, "utf8");
    const ast = espree.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true
    });
    const visit = node => {
      if (!node || typeof node !== "object") return;
      if (node.type === "ImportExpression") {
        throw new Error(`${sourceName}: dynamic import is forbidden`);
      }
      if (node.type === "CallExpression" && node.callee?.type === "Identifier"
        && node.callee.name === "require") {
        throw new Error(`${sourceName}: CommonJS require is forbidden`);
      }
      if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type)
        && node.source) {
        const specifier = node.source.value;
        if (typeof specifier !== "string" || !specifier.startsWith(".")) {
          throw new Error(`${sourceName}: aliases and bare imports are forbidden`);
        }
        const unresolved = resolve(dirname(sourcePath), specifier);
        if (extname(unresolved) !== ".js") {
          throw new Error(`${sourceName}: imports require an explicit .js target`);
        }
        const candidate = unresolved;
        if (!candidate.startsWith(`${repositoryRoot}/`)) {
          throw new Error(`${sourceName}: local import escapes the repository`);
        }
        if (basename(candidate) === "index.js") {
          throw new Error(`${sourceName}: public barrels are forbidden`);
        }
        let targetPath;
        try {
          targetPath = realpathSync(candidate);
        } catch {
          throw new Error(`${sourceName}: unknown local import ${specifier}`);
        }
        if (targetPath !== candidate) {
          throw new Error(`${sourceName}: symlink import indirection is forbidden`);
        }
        const targetName = namedPaths.get(targetPath);
        if (!targetName) throw new Error(`${sourceName}: unknown local import ${specifier}`);
        edges.add(`${sourceName}->${targetName}`);
      }
      for (const key of espree.VisitorKeys[node.type] || []) {
        const child = node[key];
        if (Array.isArray(child)) child.forEach(visit);
        else visit(child);
      }
    };
    visit(ast);
  }

  assert.deepEqual([...edges].sort(), [...allowedEdges].sort(), "exact Task 2 import edges");
  const taskNames = new Set(Object.keys(TASK2_RUNTIME_MODULES));
  const adjacency = new Map([...taskNames].map(name => [name, []]));
  for (const edge of edges) {
    const [source, target] = edge.split("->");
    if (taskNames.has(target)) adjacency.get(source).push(target);
  }
  const visiting = new Set();
  const visited = new Set();
  const walk = (node, path = []) => {
    if (visiting.has(node)) throw new Error(`Task 2 import cycle: ${[...path, node].join("->")}`);
    if (visited.has(node)) return;
    visiting.add(node);
    for (const target of adjacency.get(node).sort()) walk(target, [...path, node]);
    visiting.delete(node);
    visited.add(node);
  };
  for (const node of [...taskNames].sort()) walk(node);
  return Object.freeze([...edges].sort());
}

test("every Task 2 runtime module obeys the exact canonical import graph", () => {
  assert.deepEqual(assertTask2ImportGraph(), [...TASK2_ALLOWED_IMPORT_EDGES].sort());
});

test("the import graph rejects every syntax and resolution bypass", () => {
  const sourceFor = name => readFileSync(resolve(TASK2_RUNTIME_MODULES[name]), "utf8");
  for (const [label, injected, pattern] of [
    ["dynamic", 'void import("./contentDeckTransactions.js");', /dynamic import/u],
    ["CommonJS", 'require("./contentDeckTransactions.js");', /CommonJS require/u],
    ["alias", 'import "@/features/soundSeekers/engine/contentDeckState.js";', /aliases/u],
    ["extensionless", 'import "./contentDeckState";', /explicit \.js/u],
    ["barrel", 'import "../index.js";', /barrels/u],
    ["unknown local", 'import "../content/reviewSequences.js";', /unknown local/u],
    ["forbidden edge", 'import "./contentDeckTransactions.js";', /exact Task 2 import edges/u]
  ]) {
    assert.throws(() => assertTask2ImportGraph({
      sourceOverrides: new Map([["stateV2", `${injected}\n${sourceFor("stateV2")}`]])
    }), pattern, label);
  }

  const cycleEdge = "contentDeckState->stateV2";
  assert.throws(() => assertTask2ImportGraph({
    sourceOverrides: new Map([[
      "contentDeckState",
      `import { createSoundSeekersState } from "./stateV2.js";\n${sourceFor("contentDeckState")}`
    ]]),
    allowedEdges: [...TASK2_ALLOWED_IMPORT_EDGES, cycleEdge]
  }), /import cycle/u);
});

test("five placements persist one literacy action at a time and credit only final completion", () => {
  const stableChallenge = challenge => ({
    targetOrdinal: challenge.targetOrdinal,
    targetId: challenge.targetId,
    optionTokens: challenge.optionTokens,
    expectedToken: challenge.expectedToken,
    instructionId: challenge.instructionId,
    powerId: challenge.powerId,
    expectedAction: challenge.expectedAction,
    recordsDomain: challenge.recordsDomain
  });
  let state = createSoundSeekersState();
  for (const placement of CONTENT_DECK_PLACEMENTS) {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === placement.stopId);
    const served = serveContentDeck(state.contentDecks, {
      binding: placement.contentBinding,
      visitId: "visit:" + placement.placementId,
      stopId: placement.stopId,
      journeyStep: expedition.stopIndex,
      seed: expedition.stopIndex
    });
    state = { ...state, contentDecks: served.nextState };
    const begun = beginContentPlacementAttempt(state, {
      placementId: placement.placementId, visitId: served.visitId
    });
    state = begun.nextState;
    assert.deepEqual(state.checkpoint.contentPlacement, {
      kind: "content_placement",
      placementId: placement.placementId,
      category: placement.category,
      visitId: served.visitId,
      stopId: placement.stopId,
      journeyStep: expedition.stopIndex,
      stage: "response_pending",
      targetOrdinal: 0,
      attemptOrdinal: 0,
      attemptId: "content-placement-attempt:" + served.visitId + ":" + placement.placementId + ":0:0"
    });
    assert.strictEqual(
      begun.challenge,
      materializeContentPlacementChallenge(state, {
        placementId: placement.placementId, visitId: served.visitId
      })
    );
    assert.equal(Object.hasOwn(toChildChallengeView(begun.challenge), "expectedToken"), false);

    if (placement.category === "morphology") {
      const input = canonicalS38ResponseInput(state, begun.challenge, served.visitId);
      const completed = commitContentPlacementResponse(state, input);
      assert.deepEqual({
        event: completed.event, outcome: completed.outcome,
        completed: completed.completed, correction: completed.correction
      }, { event: null, outcome: "completed", completed: true, correction: null });
      assert.equal(completed.nextState.evidence.length, state.evidence.length);
      assert.equal(validContentDeckUses(completed.nextState, "morphology").length, 1);
      const retry = commitContentPlacementResponse(completed.nextState, input);
      assert.deepEqual(retry.nextState, completed.nextState);
      assert.throws(() => commitContentPlacementResponse(completed.nextState, {
        ...input, at: "2026-09-02T00:00:01.000Z"
      }), /receipt|divergent|fingerprint/i);
      state = completed.nextState;
      continue;
    }

    const first = begun.challenge;
    const firstCorrectInput = canonicalPlacementResponseInput(state, first, {
      token: first.expectedToken,
      at: "2026-09-01T23:59:59.000Z"
    });
    assert.throws(() => commitContentPlacementResponse(state, {
      ...firstCorrectInput,
      challenge: {
        ...first,
        optionTokens: [...first.optionTokens].reverse()
      }
    }), /canonical|challenge|tamper/i, `${placement.placementId}: first submission tamper`);
    const wrongInput = canonicalPlacementResponseInput(state, first, {
      token: first.optionTokens.find(token => token !== first.expectedToken),
      at: "2026-09-02T00:00:00.000Z"
    });
    const wrong = commitContentPlacementResponse(state, wrongInput);
    assert.equal(wrong.completed, false);
    assert.equal(wrong.event.correct, false);
    assert.equal(wrong.event.supportLevel, 0);
    assert.equal(wrong.event.revealed, false);
    assert.deepEqual(pickCorrectionTruth(wrong.correction), {
      missCount: 1, supportLevel: 1, modelOnce: false, requiresFreshAttempt: false
    });
    assert.equal(wrong.nextState.evidence.some(event => event.id === wrong.event.id), true);
    assert.equal(validContentDeckUses(wrong.nextState, "alternatives").length, 0);
    assert.equal(wrong.nextState.checkpoint.contentPlacement.targetOrdinal, 0);
    assert.equal(wrong.nextState.checkpoint.contentPlacement.attemptOrdinal, 1);

    const wrongRetry = commitContentPlacementResponse(wrong.nextState, wrongInput);
    assert.deepEqual(wrongRetry.nextState, wrong.nextState);
    assert.deepEqual(wrongRetry.event, wrong.event);
    assert.throws(() => commitContentPlacementResponse(wrong.nextState, {
      ...wrongInput,
      response: { ...wrongInput.response, token: first.expectedToken }
    }), /receipt|divergent|immutable/i);

    const reloadedWrongState = normalizeSoundSeekersState(
      JSON.parse(JSON.stringify(wrong.nextState))
    );
    const resumed = resumeContentPlacementAttempt(
      reloadedWrongState,
      { placementId: placement.placementId, visitId: served.visitId }
    );
    assert.equal(resumed.attempt.supportLevel, 1);
    assert.equal(resumed.attempt.revealed, false);
    assert.deepEqual(resumed.correction, wrong.correction);
    assert.deepEqual(stableChallenge(resumed.challenge), stableChallenge(first),
      `${placement.placementId}: retry target/options/key/action changed after reload`);
    let current = reloadedWrongState;
    let result = commitContentPlacementResponse(current,
      canonicalPlacementResponseInput(current, resumed.challenge, {
        token: resumed.challenge.expectedToken,
        at: "2026-09-02T00:01:00.000Z"
      }));
    assert.equal(result.event.correct, true);
    assert.equal(result.event.supportLevel, 1);
    assert.equal(result.event.revealed, false);
    assert.equal(result.nextState.evidence.some(event => event.id === wrong.event.id), true);

    while (!result.completed) {
      current = normalizeSoundSeekersState(JSON.parse(JSON.stringify(result.nextState)));
      const resumedNext = resumeContentPlacementAttempt(current, {
        placementId: placement.placementId, visitId: served.visitId
      });
      const next = materializeContentPlacementChallenge(current, {
        placementId: placement.placementId, visitId: served.visitId
      });
      assert.deepEqual(stableChallenge(next), stableChallenge(resumedNext.challenge));
      assert.equal(next.targetOrdinal, current.checkpoint.contentPlacement.targetOrdinal);
      result = commitContentPlacementResponse(current,
        canonicalPlacementResponseInput(current, next, {
          token: next.expectedToken,
          at: new Date(Date.parse("2026-09-02T00:02:00.000Z")
            + (next.targetOrdinal * 1000)).toISOString()
        }));
    }
    const reloadedCompleted = normalizeSoundSeekersState(
      JSON.parse(JSON.stringify(result.nextState))
    );
    assert.equal(reloadedCompleted.checkpoint?.contentPlacement, undefined);
    assert.equal(validContentDeckUses(reloadedCompleted, "alternatives").length,
      validContentDeckUses(state, "alternatives").length + 1);
    const use = validContentDeckUses(reloadedCompleted, "alternatives").at(-1);
    assert.ok(use.attemptReceiptIds.length >= placement.challengeTargetIds.length + 1);
    assertReceiptChainExactlyCoversPlacementActions(reloadedCompleted, use, placement);
    state = reloadedCompleted;
  }
});

test("third placement miss models once, survives reload, and forces revealed support", () => {
  const run = beginCanonicalAlternativePlacement("s16-alternative");
  let state = run.state;
  assert.throws(() => completeContentPlacementCorrectionModel(state, run.identity),
    /model|third|stage/i, "model cannot run before the third miss");
  const observedSupport = [];
  let stableCurrentChallenge = null;
  let lastWrongInput = null;
  for (let miss = 0; miss < 3; miss += 1) {
    const challenge = materializeContentPlacementChallenge(state, run.identity);
    const invariant = {
      targetOrdinal: challenge.targetOrdinal,
      targetId: challenge.targetId,
      optionTokens: challenge.optionTokens,
      expectedToken: challenge.expectedToken,
      instructionId: challenge.instructionId,
      powerId: challenge.powerId,
      expectedAction: challenge.expectedAction,
      recordsDomain: challenge.recordsDomain
    };
    stableCurrentChallenge ||= invariant;
    assert.deepEqual(invariant, stableCurrentChallenge,
      `miss ${miss}: target/options/private key/action changed`);
    lastWrongInput = canonicalPlacementResponseInput(state, challenge, {
        token: challenge.optionTokens.find(token => token !== challenge.expectedToken),
        at: new Date(Date.parse("2026-09-02T01:00:00.000Z") + (miss * 1000)).toISOString()
      });
    const result = commitContentPlacementResponse(state, lastWrongInput);
    observedSupport.push([result.event.supportLevel, result.event.revealed]);
    state = normalizeSoundSeekersState(JSON.parse(JSON.stringify(result.nextState)));
    if (miss < 2) {
      const resumedAttempt = resumeContentPlacementAttempt(state, run.identity);
      assert.deepEqual({
        targetOrdinal: resumedAttempt.challenge.targetOrdinal,
        targetId: resumedAttempt.challenge.targetId,
        optionTokens: resumedAttempt.challenge.optionTokens,
        expectedToken: resumedAttempt.challenge.expectedToken,
        instructionId: resumedAttempt.challenge.instructionId,
        powerId: resumedAttempt.challenge.powerId,
        expectedAction: resumedAttempt.challenge.expectedAction,
        recordsDomain: resumedAttempt.challenge.recordsDomain
      }, stableCurrentChallenge, `miss ${miss}: reload changed target/options/private key/action`);
    }
  }
  assert.deepEqual(observedSupport, [[0, false], [1, false], [2, false]]);
  assert.equal(state.checkpoint.contentPlacement.stage, "model_pending");
  assertNoKeys(state.checkpoint.contentPlacement, [
    "correction", "correctionRecordId", "missCount", "supportLevel", "revealed"
  ]);
  assert.throws(() => materializeContentPlacementChallenge(state, run.identity), /model.*pending/i);
  const resumed = resumeContentPlacementAttempt(state, run.identity);
  assert.equal(resumed.challenge, null);
  assert.equal(resumed.correction.modelOnce, true);
  assert.equal(resumed.correction.supportLevel, 3);

  assert.throws(() => commitContentPlacementResponse(state, lastWrongInput), /model.*pending/i);
  assert.throws(() => completeContentPlacementCorrectionModel(state, {
    ...run.identity, placementId: "s28-alternative"
  }), /placement|identity|model/i);
  assert.throws(() => completeContentPlacementCorrectionModel(state, {
    ...run.identity, visitId: `${run.identity.visitId}:stale`
  }), /visit|identity|model/i);
  const beforeModel = {
    attemptId: state.checkpoint.contentPlacement.attemptId,
    evidence: state.evidence.length,
    receipts: validAttemptReceipts(state).length,
    uses: validContentDeckUses(state, "alternatives").length,
    receiptJson: JSON.stringify(state.attemptReceipts)
  };
  const modeled = completeContentPlacementCorrectionModel(state, run.identity);
  assert.equal(modeled.nextState.evidence.length, beforeModel.evidence);
  assert.equal(validAttemptReceipts(modeled.nextState).length, beforeModel.receipts);
  assert.equal(validContentDeckUses(modeled.nextState, "alternatives").length, beforeModel.uses);
  assert.equal(JSON.stringify(modeled.nextState.attemptReceipts), beforeModel.receiptJson);
  assert.equal(modeled.nextState.checkpoint.contentPlacement.attemptId, beforeModel.attemptId);
  assert.equal(modeled.nextState.checkpoint.contentPlacement.stage, "response_pending");
  assertNoKeys(modeled.nextState.checkpoint.contentPlacement, [
    "answer", "expectedToken", "response", "audio", "correction", "correctionRecordId",
    "missCount", "supportLevel", "revealed", "selected", "intended"
  ]);
  assert.equal(/"(answer|expectedToken|response|audio|supportLevel|revealed|selected|intended)"/u
    .test(JSON.stringify({
      checkpoint: modeled.nextState.checkpoint,
      attemptReceipts: modeled.nextState.attemptReceipts
    })), false);
  assert.equal(modeled.attempt.supportLevel, 3);
  assert.equal(modeled.attempt.revealed, true);
  assert.equal(modeled.attempt.attemptId, beforeModel.attemptId);
  assert.deepEqual({
    targetOrdinal: modeled.challenge.targetOrdinal,
    targetId: modeled.challenge.targetId,
    optionTokens: modeled.challenge.optionTokens,
    expectedToken: modeled.challenge.expectedToken,
    instructionId: modeled.challenge.instructionId,
    powerId: modeled.challenge.powerId,
    expectedAction: modeled.challenge.expectedAction,
    recordsDomain: modeled.challenge.recordsDomain
  }, stableCurrentChallenge, "model consumption changed target/options/private key/action");
  const reloadedModeledState = normalizeSoundSeekersState(
    JSON.parse(JSON.stringify(modeled.nextState))
  );
  const reloadedModeled = resumeContentPlacementAttempt(reloadedModeledState, run.identity);
  assert.equal(reloadedModeled.attempt.attemptId, beforeModel.attemptId);
  assert.equal(reloadedModeled.attempt.supportLevel, 3);
  assert.equal(reloadedModeled.attempt.revealed, true);
  assert.deepEqual(reloadedModeled.correction, modeled.correction);
  assert.deepEqual({
    targetOrdinal: reloadedModeled.challenge.targetOrdinal,
    targetId: reloadedModeled.challenge.targetId,
    optionTokens: reloadedModeled.challenge.optionTokens,
    expectedToken: reloadedModeled.challenge.expectedToken,
    instructionId: reloadedModeled.challenge.instructionId,
    powerId: reloadedModeled.challenge.powerId,
    expectedAction: reloadedModeled.challenge.expectedAction,
    recordsDomain: reloadedModeled.challenge.recordsDomain
  }, stableCurrentChallenge, "post-model reload changed target/options/private key/action");
  assert.throws(() => completeContentPlacementCorrectionModel(
    reloadedModeledState, run.identity
  ),
    /model|stage|consumed/i, "the same model cannot run twice");
  const supportedMiss = commitContentPlacementResponse(reloadedModeledState,
    canonicalPlacementResponseInput(reloadedModeledState, reloadedModeled.challenge, {
      token: reloadedModeled.challenge.optionTokens.find(
        token => token !== reloadedModeled.challenge.expectedToken
      ),
      at: "2026-09-02T01:00:04.000Z"
    }));
  assert.equal(supportedMiss.outcome, "retry");
  assert.equal(supportedMiss.event.supportLevel, 3);
  assert.equal(supportedMiss.event.revealed, true);
  assert.equal(supportedMiss.nextState.checkpoint.contentPlacement.stage, "response_pending");
  assert.throws(() => completeContentPlacementCorrectionModel(
    supportedMiss.nextState, run.identity
  ), /model|stage|third/i, "a later miss cannot trigger a second model");
  const freshSupported = materializeContentPlacementChallenge(
    supportedMiss.nextState, run.identity
  );
  const supported = commitContentPlacementResponse(supportedMiss.nextState,
    canonicalPlacementResponseInput(supportedMiss.nextState, freshSupported, {
      token: freshSupported.expectedToken,
      at: "2026-09-02T01:00:05.000Z"
    }));
  assert.equal(supported.event.correct, true);
  assert.equal(supported.event.supportLevel, 3);
  assert.equal(supported.event.revealed, true);
  assert.equal(evidenceIsIndependent(supported.event), false);
});

test("receipt SHA-256 values match an independent Node oracle", () => {
  assert.equal(independentReceiptSha({ b: 1, a: "é" }),
    "aa58fba8483623bed37c1b02edfccbdd9a53123837c20bfa4cb4049993a2872e");
  const oracleCases = buildReceiptOracleCasesThroughPublicReducers();
  assert.deepEqual(oracleCases.map(item => item.id), [
    "placement-first-wrong", "placement-supported-correct",
    "placement-three-miss-modeled-supported-correct", "s38-zero-event",
    "story-non-boss-private-key", "story-boss"
  ]);
  for (const item of oracleCases) {
    const literal = JSON.parse(JSON.stringify(item.literalCanonicalInput));
    const independentlySorted = sortCanonicalJsonForTestOnly(literal);
    const expectedSha256 = createHash("sha256")
      .update(Buffer.from(JSON.stringify(independentlySorted), "utf8"))
      .digest("hex");
    assert.equal(item.receipt.inputSha256, expectedSha256, item.id);
  }
  const s38 = oracleCases.find(item => item.id === "s38-zero-event");
  const changedTime = {
    ...s38.literalCanonicalInput, at: "2026-09-02T00:00:01.000Z"
  };
  const text = oracleCases.find(item => item.id === "story-non-boss-private-key");
  const changedPrivateKey = {
    ...text.literalCanonicalInput,
    challenge: {
      ...text.literalCanonicalInput.challenge,
      expectedToken: text.literalCanonicalInput.challenge.optionTokens.find(
        token => token !== text.literalCanonicalInput.challenge.expectedToken
      )
    }
  };
  const supported = oracleCases.find(item => item.id === "placement-supported-correct");
  const changedCorrection = {
    ...supported.literalCanonicalInput,
    correction: { ...supported.literalCanonicalInput.correction, supportLevel: 2 }
  };
  const boss = oracleCases.find(item => item.id === "story-boss");
  const changedAudio = {
    ...boss.literalCanonicalInput,
    audio: { ...boss.literalCanonicalInput.audio, status: "blocked" }
  };
  for (const [item, changed] of [
    [s38, changedTime], [text, changedPrivateKey],
    [supported, changedCorrection], [boss, changedAudio]
  ]) {
    const changedSha = independentReceiptSha(changed);
    assert.notEqual(changedSha, item.receipt.inputSha256, item.id);
    assert.throws(() => retryReceiptOracleCaseWithStoredReceiptSha(item, changedSha),
      /receipt|divergent|fingerprint|canonical/i, item.id);
  }
});

test("all 32 non-boss transfer records own literal canonical decision contracts", () => {
  const expectedPositions = {
    s1: "b", s2: "a", s3: "c", s4: "b",
    s6: "c", s7: "a", s8: "b", s9: "c",
    s11: "a", s12: "c", s13: "b", s14: "a",
    s16: "b", s17: "c", s18: "a", s19: "b",
    s21: "c", s22: "a", s23: "b", s24: "c",
    s26: "a", s27: "b", s28: "c", s29: "a",
    s31: "b", s32: "c", s33: "a", s34: "b",
    s36: "c", s37: "a", s38: "b", s39: "c"
  };
  const actual = SOUND_SEEKERS_EXPEDITIONS.filter(expedition => !expedition.transfer.boss)
    .map(expedition => {
      const { stopId } = expedition;
      const record = getContentDeckCatalogRecord("transfer", `transfer:${stopId}`);
      const optionTokens = ["a", "b", "c"].map(letter => `ct-${stopId}-${letter}`);
      assert.deepEqual(record.decisionContract, {
        expectedToken: `ct-${stopId}-${expectedPositions[stopId]}`,
        optionTokens
      });
      assert.equal(Object.isFrozen(record.decisionContract), true);
      assert.equal(Object.isFrozen(record.decisionContract.optionTokens), true);
      assert.equal(record.bossDecision, null);
      return stopId;
    });
  assert.deepEqual(actual, Object.keys(expectedPositions));
});

test("exactly eight transfer records own canonical private three-choice boss decisions", () => {
  const expected = [
    ["s5", "cat", "boss-s5-choice-b", [
      ["boss-s5-choice-a", "an animal that swims", "swimming-animal"],
      ["boss-s5-choice-b", "a small pet animal", "small-pet-animal"],
      ["boss-s5-choice-c", "an animal that flies", "flying-animal"]
    ]],
    ["s10", "thing", "boss-s10-choice-c", [
      ["boss-s10-choice-a", "a person you meet", "person-you-meet"],
      ["boss-s10-choice-b", "a place you visit", "place-you-visit"],
      ["boss-s10-choice-c", "an object you use", "object-you-use"]
    ]],
    ["s15", "truck", "boss-s15-choice-a", [
      ["boss-s15-choice-a", "a large road vehicle", "goods-truck"],
      ["boss-s15-choice-b", "a small water vessel", "small-boat"],
      ["boss-s15-choice-c", "a seat with a back", "single-chair"]
    ]],
    ["s20", "stone", "boss-s20-choice-b", [
      ["boss-s20-choice-a", "water falling from clouds", "falling-rain"],
      ["boss-s20-choice-b", "a hard piece of rock", "hand-stone"],
      ["boss-s20-choice-c", "small round money", "single-coin"]
    ]],
    ["s25", "night", "boss-s25-choice-c", [
      ["boss-s25-choice-a", "water falling from clouds", "falling-rain"],
      ["boss-s25-choice-b", "the light time after morning", "day-sky"],
      ["boss-s25-choice-c", "the dark time before morning", "night-sky"]
    ]],
    ["s30", "point", "boss-s30-choice-a", [
      ["boss-s30-choice-a", "aim at one place", "point-at-target"],
      ["boss-s30-choice-b", "strike your hands together", "clap-hands"],
      ["boss-s30-choice-c", "rest on a seat", "sit-on-seat"]
    ]],
    ["s35", "near", "boss-s35-choice-b", [
      ["boss-s35-choice-a", "a long distance away", "far-object"],
      ["boss-s35-choice-b", "a short distance away", "near-object"],
      ["boss-s35-choice-c", "the place where you live", "home-place"]
    ]],
    ["s40", "action", "boss-s40-choice-c", [
      ["boss-s40-choice-a", "something you can hold", "held-object"],
      ["boss-s40-choice-b", "somewhere you can go", "destination-place"],
      ["boss-s40-choice-c", "something someone does", "person-doing-action"]
    ]]
  ];
  const actual = SOUND_SEEKERS_EXPEDITIONS.map(expedition => {
    const record = getContentDeckCatalogRecord("transfer", `transfer:${expedition.stopId}`);
    if (!expedition.transfer.boss) {
      assert.equal(record.bossDecision, null);
      return null;
    }
    assert.equal(Object.isFrozen(record.bossDecision), true);
    assert.equal(Object.isFrozen(record.bossDecision.options), true);
    assert.equal(record.bossDecision.options.every(Object.isFrozen), true);
    assert.deepEqual(record.decisionContract, {
      expectedToken: record.bossDecision.expectedToken,
      optionTokens: record.bossDecision.options.map(option => option.token)
    });
    return [expedition.stopId, record.wordId, record.bossDecision.expectedToken,
      record.bossDecision.options.map(option => [option.token, option.childText, option.semanticCue])];
  }).filter(Boolean);
  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual.flatMap(([, , , options]) => options.map(([token]) => token))).size, 24);

  const assertDeepFrozen = value => {
    if (!value || typeof value !== "object") return;
    assert.equal(Object.isFrozen(value), true);
    for (const child of Object.values(value)) assertDeepFrozen(child);
  };
  for (const [stopId, , expectedToken, expectedOptions] of expected) {
    const stopIndex = Number(stopId.slice(1));
    const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
      stopId, journeyStep: stopIndex, seed: stopIndex
    });
    const pending = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId: `story-transfer:${stopIndex}:${stopId}`,
      narrativeChoiceToken: `narrative-${stopId}-left`
    });
    const challenge = materializeBossTransferChallenge(pending, {
      transactionId: `story-transfer:${stopIndex}:${stopId}`
    });
    const childOptions = projectBossTransferOptionsForChild(pending, {
      transactionId: `story-transfer:${stopIndex}:${stopId}`
    });
    const childChallenge = toChildChallengeView(challenge);
    assert.deepEqual(challenge.optionTokens, expectedOptions.map(([token]) => token), stopId);
    assert.equal(challenge.expectedToken, expectedToken, stopId);
    assert.deepEqual(childOptions, expectedOptions.map(([token, childText, semanticCue]) => ({
      token, childText, semanticCue
    })), stopId);
    assert.deepEqual(childChallenge.optionTokens, expectedOptions.map(([token]) => token), stopId);
    assert.equal(Object.hasOwn(childChallenge, "expectedToken"), false, stopId);
    assertDeepFrozen(challenge);
    assertDeepFrozen(childOptions);
    assertDeepFrozen(childChallenge);
  }
});

test("every stop commits one truthful final pair after durable wrong-to-correct attempts", () => {
  let connectedTextEvents = 0;
  let novelDecodingEvents = 0;
  let incorrectEvents = 0;
  let accumulated = createSoundSeekersState();
  const firstPassTransactionIds = [];
  const bossNarrativeTokens = Object.freeze({
    s5: "narrative-s5-left", s10: "narrative-s10-left",
    s15: "narrative-s15-left", s20: "narrative-s20-left",
    s25: "narrative-s25-left", s30: "narrative-s30-left",
    s35: "narrative-s35-left", s40: "narrative-s40-left"
  });
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const { stopId, stopIndex } = expedition;
    const evidenceCountBefore = accumulated.evidence.length;
    const storyUseCountBefore = validContentDeckUses(accumulated, "stories").length;
    const transferUseCountBefore = validContentDeckUses(accumulated, "transfer").length;
    const begun = beginStoryTransferTransaction(accumulated, {
      stopId,
      journeyStep: stopIndex,
      seed: stopIndex
    });
    const expectedTransactionId = `story-transfer:${stopIndex}:${stopId}`;
    const storyVisitId = `visit:${expectedTransactionId}:story`;
    const transferVisitId = `visit:${expectedTransactionId}:transfer`;
    const storyUseId = `${storyVisitId}:${stopId}-story:content-use`;
    const transferUseId = `${transferVisitId}:${stopId}-transfer:content-use`;
    assert.deepEqual(begun.transaction, {
      kind: "story_transfer",
      transactionId: expectedTransactionId,
      stopId,
      journeyStep: stopIndex,
      boss: expedition.transfer.boss,
      storyVisitId,
      storyUseId,
      transferVisitId,
      transferUseId
    });
    assert.notEqual(begun.transaction.storyVisitId, begun.transaction.transferVisitId);
    assert.notEqual(begun.transaction.storyUseId, begun.transaction.transferUseId);
    assert.equal(validContentDeckUses(begun.nextState, "stories").length, storyUseCountBefore);
    assert.equal(validContentDeckUses(begun.nextState, "transfer").length, transferUseCountBefore);
    assert.equal(begun.nextState.evidence.length, evidenceCountBefore);

    const narrativeChoiceToken = bossNarrativeTokens[stopId] ?? null;
    if (stopId === "s1") {
      assert.throws(() => checkpointStoryTransferTransaction(begun.nextState, {
        transactionId: expectedTransactionId, narrativeChoiceToken: "forbidden-non-boss-token"
      }), /non-boss.*narrative|token.*null/i);
    }
    if (stopId === "s5") {
      assert.throws(() => checkpointStoryTransferTransaction(begun.nextState, {
        transactionId: expectedTransactionId, narrativeChoiceToken: null
      }), /boss.*narrative|nonempty.*token/i);
    }
    const pending = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId: expectedTransactionId,
      narrativeChoiceToken
    });
    assert.deepEqual(pending.checkpoint.storyTransfer, {
      kind: "story_transfer",
      transactionId: expectedTransactionId,
      stopId,
      journeyStep: stopIndex,
      stage: "response_pending",
      storyVisitId,
      transferVisitId,
      narrativeChoiceToken,
      attemptOrdinal: 0,
      attemptId: `story-transfer-attempt:${expectedTransactionId}:0`
    });
    assert.equal(pending.evidence.length, evidenceCountBefore, "the story bridge emits no separate evidence");
    const resumed = resumeStoryTransferTransaction(pending, { transactionId: expectedTransactionId });
    assert.deepEqual(resumed.transaction, begun.transaction);
    assert.deepEqual(resumed.attempt, {
      attemptOrdinal: 0,
      attemptId: `story-transfer-attempt:${expectedTransactionId}:0`,
      supportLevel: 0,
      revealed: false
    });
    assert.equal(resumed.correction, null);
    assert.equal(resumed.storyServed.recordId, `story:scene-${stopId}`);
    assert.equal(resumed.transferServed.recordId, `transfer:${stopId}`);
    for (const [category, servedInstance] of [
      ["stories", resumed.storyServed],
      ["transfer", resumed.transferServed]
    ]) {
      assert.throws(() => recordContentDeckUse(
        pending.contentDecks,
        servedInstance,
        getContentDeckOwnerBinding(category, servedInstance.slotId)
      ), /story.*transfer transaction|non-heart use/i);
    }

    const transferRecord = getContentDeckCatalogRecord("transfer", `transfer:${stopId}`);
    let challenge = materializeStoryTransferChallenge(pending, {
      transactionId: expectedTransactionId
    });
    assert.strictEqual(challenge, expedition.transfer.boss
      ? materializeBossTransferChallenge(pending, { transactionId: expectedTransactionId })
      : materializeStoryTransferChallenge(pending, { transactionId: expectedTransactionId }));
    if (expedition.transfer.boss) {
      const childOptions = projectBossTransferOptionsForChild(pending, {
        transactionId: expectedTransactionId
      });
      assert.equal(challenge.optionTokens.length, 3);
      assert.equal(childOptions.length, 3);
      assert.deepEqual(childOptions.map(option => Object.keys(option).sort()),
        Array(3).fill(["childText", "semanticCue", "token"]));
      assert.equal(JSON.stringify(childOptions).includes("expected"), false);
      assert.equal(Object.hasOwn(toChildChallengeView(challenge), "expectedToken"), false);
      assert.equal(Object.hasOwn(resumed.transferServed, "bossDecision"), false);
    }
    const beforeComplete = structuredClone(pending);
    assert.equal(assertInstructionMatchesChallenge(
      getInstructionContract(challenge.instructionId), challenge
    ), true);
    if (stopId === "s1") {
      assert.throws(() => completeStoryTransferTransaction(pending, {
        transactionId: expectedTransactionId,
        challenge: { ...challenge, recordsDomain: "word_decoding" },
        response: { kind: "literacy-answer", token: challenge.expectedToken },
        audio: { status: "completed" },
        at: "2026-09-02T00:01:00.000Z",
        sessionDay: "2026-09-02"
      }), /transfer.*tuple|domain/i);
      const forgedExpectedToken = challenge.optionTokens.find(token => token !== challenge.expectedToken);
      assert.throws(() => completeStoryTransferTransaction(pending, {
        transactionId: expectedTransactionId,
        challenge: { ...challenge, expectedToken: forgedExpectedToken },
        response: { kind: "literacy-answer", token: forgedExpectedToken },
        audio: { status: "completed" },
        at: "2026-09-02T00:01:00.000Z",
        sessionDay: "2026-09-02"
      }), /canonical.*decision|fresh.*materialized|expectedToken/i,
      "the first submission cannot redefine the non-boss answer key");
      assert.deepEqual(pending, beforeComplete, "a failed transaction cannot partially write");
    }
    if (stopId === "s5") {
      const tamperedBossTransferId = `${transferRecord.bossTransferId}:tampered`;
      assert.throws(() => completeStoryTransferTransaction(pending, {
        transactionId: expectedTransactionId,
        challenge: {
          ...challenge,
          bossTransferId: tamperedBossTransferId,
          targetId: bossNovelTargetId({
            wordId: transferRecord.wordId,
            bossTransferId: tamperedBossTransferId
          })
        },
        response: { kind: "literacy-answer", token: challenge.expectedToken },
        audio: { status: "completed" },
        at: "2026-09-02T00:01:00.000Z",
        sessionDay: "2026-09-02"
      }), /boss.*context|bossTransferId|transfer.*identity/i);
      assert.throws(() => completeStoryTransferTransaction(pending, {
        transactionId: expectedTransactionId,
        challenge: {
          ...challenge,
          expectedToken: transferRecord.wordId,
          optionTokens: [transferRecord.wordId]
        },
        response: { kind: "literacy-answer", token: transferRecord.wordId },
        audio: { status: "completed" },
        at: "2026-09-02T00:01:00.000Z",
        sessionDay: "2026-09-02"
      }), /canonical boss decision|three.*options|fabricated/i);
      assert.deepEqual(pending, beforeComplete, "a boss context tamper cannot partially write");
    }
    let completionState = pending;
    if (["s1", "s5"].includes(stopId)) {
      const wrongInput = {
        transactionId: expectedTransactionId,
        challenge,
        response: {
          kind: "literacy-answer",
          token: challenge.optionTokens.find(token => token !== challenge.expectedToken)
        },
        audio: { status: "completed" },
        at: "2026-09-02T00:00:00.000Z",
        sessionDay: "2026-09-02"
      };
      const wrong = completeStoryTransferTransaction(pending, wrongInput);
      assert.deepEqual(Object.keys(wrong).sort(), [
        "completed", "correction", "event", "nextState", "outcome"
      ]);
      assert.equal(wrong.completed, false);
      assert.equal(wrong.outcome, "retry");
      assert.equal(wrong.event.correct, false);
      assert.equal(wrong.event.supportLevel, 0);
      assert.equal(wrong.event.revealed, false);
      assert.deepEqual(pickCorrectionTruth(wrong.correction), {
        missCount: 1, supportLevel: 1, modelOnce: false, requiresFreshAttempt: false
      });
      assert.equal(validContentDeckUses(wrong.nextState, "stories").length, storyUseCountBefore);
      assert.equal(validContentDeckUses(wrong.nextState, "transfer").length, transferUseCountBefore);
      assert.deepEqual(wrong.nextState.checkpoint.storyTransfer, {
        ...pending.checkpoint.storyTransfer,
        attemptOrdinal: 1,
        attemptId: `story-transfer-attempt:${expectedTransactionId}:1`
      });
      assertNoKeys(wrong.nextState.checkpoint.storyTransfer, [
        "correction", "correctionRecordId", "missCount", "supportLevel", "revealed"
      ]);
      const wrongRetry = completeStoryTransferTransaction(wrong.nextState, wrongInput);
      assert.equal(wrongRetry.completed, false);
      assert.deepEqual(wrongRetry.event, wrong.event);
      assert.deepEqual(wrongRetry.nextState, wrong.nextState);
      assert.throws(() => completeStoryTransferTransaction(wrong.nextState, {
        ...wrongInput,
        response: { kind: "literacy-answer", token: challenge.expectedToken }
      }), /divergent.*attempt|immutable.*event/i);
      completionState = wrong.nextState;
      const fresh = resumeStoryTransferTransaction(completionState, {
        transactionId: expectedTransactionId
      });
      assert.deepEqual(fresh.attempt, {
        attemptOrdinal: 1,
        attemptId: `story-transfer-attempt:${expectedTransactionId}:1`,
        supportLevel: 1,
        revealed: false
      });
      assert.deepEqual(fresh.correction, wrong.correction);
      challenge = materializeStoryTransferChallenge(completionState, {
        transactionId: expectedTransactionId
      });
      assert.equal(challenge.attemptId, fresh.attempt.attemptId);
      incorrectEvents += 1;
    }
    const completionInput = {
      transactionId: expectedTransactionId,
      challenge,
      response: { kind: "literacy-answer", token: challenge.expectedToken },
      audio: { status: "completed" },
      at: "2026-09-02T00:01:00.000Z",
      sessionDay: "2026-09-02"
    };
    const completed = completeStoryTransferTransaction(completionState, completionInput);
    assert.deepEqual(Object.keys(completed).sort(), [
      "completed", "correction", "event", "nextState", "outcome"
    ]);
    assert.equal(completed.completed, true);
    assert.equal(completed.outcome, "completed");
    assert.equal(completed.correction, null);
    assert.equal(completed.event.correct, true);
    assert.equal(completed.event.supportLevel, ["s1", "s5"].includes(stopId) ? 1 : 0);
    assert.equal(completed.event.revealed, false);
    assert.equal(completed.nextState.checkpoint?.storyTransfer, undefined);
    assert.equal(completed.nextState.evidence.length,
      evidenceCountBefore + (["s1", "s5"].includes(stopId) ? 2 : 1));
    const event = completed.event;
    const storyUse = validContentDeckUses(completed.nextState, "stories")
      .find(use => use.useId === storyUseId);
    const transferUse = validContentDeckUses(completed.nextState, "transfer")
      .find(use => use.useId === transferUseId);
    assert.ok(storyUse);
    assert.ok(transferUse);
    assert.equal(storyUse.useId, storyUseId);
    assert.equal(transferUse.useId, transferUseId);
    assert.equal(storyUse.pairedUseId, transferUse.useId);
    assert.equal(transferUse.pairedUseId, storyUse.useId);
    assert.equal(storyUse.transactionId, expectedTransactionId);
    assert.equal(transferUse.transactionId, expectedTransactionId);
    assert.equal(storyUse.evidenceEventId, event.id);
    assert.equal(transferUse.evidenceEventId, event.id);
    assert.equal(storyUse.narrativeChoiceToken, narrativeChoiceToken);
    assert.equal(transferUse.narrativeChoiceToken, narrativeChoiceToken);
    assert.deepEqual(storyUse.attemptReceiptIds, transferUse.attemptReceiptIds);
    assert.equal(storyUse.attemptReceiptIds.length, ["s1", "s5"].includes(stopId) ? 2 : 1);
    if (expedition.transfer.boss) {
      novelDecodingEvents += 1;
      assert.deepEqual({
        domain: event.domain,
        target: event.target,
        word: event.word,
        position: event.position,
        bossTransferId: event.bossTransferId,
        connectedTextId: event.connectedTextId
      }, {
        domain: "novel_decoding",
        target: bossNovelTargetId({
          wordId: transferRecord.wordId,
          bossTransferId: transferRecord.bossTransferId
        }),
        word: transferRecord.wordId,
        position: "whole",
        bossTransferId: transferRecord.bossTransferId,
        connectedTextId: null
      });
    } else {
      connectedTextEvents += 1;
      assert.deepEqual({
        domain: event.domain,
        target: event.target,
        connectedTextId: event.connectedTextId,
        word: event.word,
        position: event.position,
        bossTransferId: event.bossTransferId
      }, {
        domain: "connected_text_transfer",
        target: `text:scene-${stopId}`,
        connectedTextId: `scene-${stopId}`,
        word: null,
        position: null,
        bossTransferId: null
      });
    }
    assert.equal(Object.hasOwn(event, "activityType"), false);
    const completedRetry = completeStoryTransferTransaction(completed.nextState, completionInput);
    assert.equal(completedRetry.completed, true);
    assert.deepEqual(completedRetry.event, completed.event);
    assert.deepEqual(completedRetry.nextState, completed.nextState);
    assert.deepEqual(completed.nextState.attemptReceipts[challenge.attemptId], {
      kind: "attempt_receipt",
      attemptId: challenge.attemptId,
      operation: "story_transfer",
      subjectId: expectedTransactionId,
      decisionOrdinal: 0,
      attemptOrdinal: Number(challenge.attemptId.split(":").at(-1)),
      inputSha256: completed.nextState.attemptReceipts[challenge.attemptId].inputSha256,
      completed: true,
      correctionRecordIds: [],
      eventIds: [completed.event.id],
      useIds: [storyUseId, transferUseId]
    });
    assert.match(completed.nextState.attemptReceipts[challenge.attemptId].inputSha256, /^[a-f0-9]{64}$/u);
    if (stopId === "s1") {
      const alternateCorrectToken = challenge.optionTokens.find(token => token !== challenge.expectedToken);
      const eventEquivalentTamper = {
        ...completionInput,
        challenge: { ...challenge, expectedToken: alternateCorrectToken },
        response: { kind: "literacy-answer", token: alternateCorrectToken }
      };
      assert.throws(() => completeStoryTransferTransaction(
        completed.nextState, eventEquivalentTamper
      ), /attempt receipt|divergent.*attempt|input fingerprint/i,
      "a changed private answer key cannot hide behind the same correct event");
    }
    if (stopId === "s5") {
      for (const mutation of ["missing", "mismatch"]) {
        const raw = structuredClone(completed.nextState);
        if (mutation === "missing") {
          delete raw.contentDecks.transfer.uses[transferUseId].narrativeChoiceToken;
        } else {
          raw.contentDecks.transfer.uses[transferUseId].narrativeChoiceToken = "narrative-s5-tampered";
        }
        const normalized = normalizeSoundSeekersState(raw);
        assert.equal(validContentDeckUses(normalized, "stories")
          .some(use => use.transactionId === expectedTransactionId), false, mutation);
        assert.equal(validContentDeckUses(normalized, "transfer")
          .some(use => use.transactionId === expectedTransactionId), false, mutation);
      }
    }
    firstPassTransactionIds.push(expectedTransactionId);
    accumulated = completed.nextState;
    if (stopId === "s1") {
      const replayBegun = beginStoryTransferTransaction(accumulated, {
        stopId,
        journeyStep: 41,
        seed: 41
      });
      assert.notEqual(replayBegun.transaction.storyVisitId, begun.transaction.storyVisitId);
      assert.notEqual(replayBegun.transaction.transferVisitId, begun.transaction.transferVisitId);
      const replayPending = checkpointStoryTransferTransaction(replayBegun.nextState, {
        transactionId: "story-transfer:41:s1",
        narrativeChoiceToken: null
      });
      const replayResumed = resumeStoryTransferTransaction(replayPending, {
        transactionId: "story-transfer:41:s1"
      });
      const replayChallenge = materializeStoryTransferChallenge(replayPending, {
        transactionId: "story-transfer:41:s1"
      });
      assert.equal(replayChallenge.attemptId, replayResumed.attempt.attemptId);
      const replayCompleted = completeStoryTransferTransaction(replayPending, {
        transactionId: "story-transfer:41:s1",
        challenge: replayChallenge,
        response: { kind: "literacy-answer", token: replayChallenge.expectedToken },
        audio: { status: "completed" },
        at: "2026-09-02T00:02:00.000Z",
        sessionDay: "2026-09-02"
      });
      assert.equal(replayCompleted.completed, true);
      assert.equal(replayCompleted.nextState.evidence.length, accumulated.evidence.length + 1);
      assert.equal(validContentDeckUses(replayCompleted.nextState, "stories").length, 2);
      assert.equal(validContentDeckUses(replayCompleted.nextState, "transfer").length, 2);
      accumulated = replayCompleted.nextState;
    }
  }
  assert.equal(connectedTextEvents, 32);
  assert.equal(novelDecodingEvents, 8);
  assert.equal(incorrectEvents, 2);
  assert.equal(new Set(firstPassTransactionIds).size, 40);
  assert.equal(validContentDeckUses(accumulated, "stories").length, 41);
  assert.equal(validContentDeckUses(accumulated, "transfer").length, 41);
  assert.equal(accumulated.evidence.length, 43);
  assert.deepEqual(validContentDeckUses(accumulated, "transfer")
    .filter(use => use.journeyStep <= 40 && use.narrativeChoiceToken !== null)
    .sort((left, right) => left.journeyStep - right.journeyStep)
    .map(use => use.narrativeChoiceToken), Object.values(bossNarrativeTokens));
  for (const transactionId of firstPassTransactionIds) {
    assert.equal(validContentDeckUses(accumulated, "stories")
      .filter(use => use.transactionId === transactionId).length, 1);
    assert.equal(validContentDeckUses(accumulated, "transfer")
      .filter(use => use.transactionId === transactionId).length, 1);
  }
});

test("story correction history survives three misses and one model before supported success", () => {
  const run = beginCanonicalStoryTransaction("s1");
  let state = run.state;
  assert.throws(() => completeStoryTransferCorrectionModel(state, run.identity),
    /model|third|stage/i, "model cannot run before the third miss");
  let latest = null;
  let lastWrongInput = null;
  let stableChallenge = null;
  for (let miss = 0; miss < 3; miss += 1) {
    const challenge = materializeStoryTransferChallenge(state, run.identity);
    const invariant = {
      targetId: challenge.targetId,
      optionTokens: challenge.optionTokens,
      expectedToken: challenge.expectedToken,
      instructionId: challenge.instructionId,
      powerId: challenge.powerId,
      expectedAction: challenge.expectedAction,
      recordsDomain: challenge.recordsDomain,
      connectedTextId: challenge.connectedTextId,
      bossTransferId: challenge.bossTransferId
    };
    stableChallenge ||= invariant;
    assert.deepEqual(invariant, stableChallenge,
      `miss ${miss}: target/options/private key/action changed`);
    lastWrongInput = {
      ...run.identity,
      challenge,
      response: {
        kind: "literacy-answer",
        token: challenge.optionTokens.find(token => token !== challenge.expectedToken)
      },
      audio: { status: "completed" },
      at: new Date(Date.parse("2026-09-02T02:00:00.000Z") + (miss * 1000)).toISOString(),
      sessionDay: "2026-09-02"
    };
    latest = completeStoryTransferTransaction(state, lastWrongInput);
    assert.deepEqual([latest.event.supportLevel, latest.event.revealed],
      [[0, false], [1, false], [2, false]][miss]);
    state = normalizeSoundSeekersState(JSON.parse(JSON.stringify(latest.nextState)));
    if (miss < 2) {
      const reloadedChallenge = materializeStoryTransferChallenge(state, run.identity);
      assert.deepEqual({
        targetId: reloadedChallenge.targetId,
        optionTokens: reloadedChallenge.optionTokens,
        expectedToken: reloadedChallenge.expectedToken,
        instructionId: reloadedChallenge.instructionId,
        powerId: reloadedChallenge.powerId,
        expectedAction: reloadedChallenge.expectedAction,
        recordsDomain: reloadedChallenge.recordsDomain,
        connectedTextId: reloadedChallenge.connectedTextId,
        bossTransferId: reloadedChallenge.bossTransferId
      }, stableChallenge, `miss ${miss}: reload changed target/options/private key/action`);
    }
  }
  assert.equal(latest.outcome, "model_required");
  assert.equal(state.checkpoint.storyTransfer.stage, "model_pending");
  assertNoKeys(state.checkpoint.storyTransfer, [
    "correction", "correctionRecordId", "missCount", "supportLevel", "revealed"
  ]);
  const resumed = resumeStoryTransferTransaction(state, run.identity);
  assert.equal(resumed.challenge, undefined);
  assert.equal(resumed.correction.missCount, 3);
  assert.equal(resumed.correction.modelOnce, true);
  assert.throws(() => completeStoryTransferTransaction(state, lastWrongInput), /model.*pending/i);
  assert.throws(() => completeStoryTransferCorrectionModel(state, {
    transactionId: `${run.identity.transactionId}:stale`
  }), /transaction|identity|model/i);
  const beforeModel = {
    attemptId: state.checkpoint.storyTransfer.attemptId,
    evidence: state.evidence.length,
    receipts: validAttemptReceipts(state).length,
    storyUses: validContentDeckUses(state, "stories").length,
    transferUses: validContentDeckUses(state, "transfer").length,
    receiptJson: JSON.stringify(state.attemptReceipts)
  };
  const modeled = completeStoryTransferCorrectionModel(state, run.identity);
  assert.equal(modeled.nextState.evidence.length, beforeModel.evidence);
  assert.equal(validAttemptReceipts(modeled.nextState).length, beforeModel.receipts);
  assert.equal(validContentDeckUses(modeled.nextState, "stories").length, beforeModel.storyUses);
  assert.equal(validContentDeckUses(modeled.nextState, "transfer").length, beforeModel.transferUses);
  assert.equal(JSON.stringify(modeled.nextState.attemptReceipts), beforeModel.receiptJson);
  assert.equal(modeled.nextState.checkpoint.storyTransfer.stage, "response_pending");
  assert.equal(modeled.nextState.checkpoint.storyTransfer.attemptId, beforeModel.attemptId);
  assert.equal(modeled.attempt.attemptId, beforeModel.attemptId);
  assertNoKeys(modeled.nextState.checkpoint.storyTransfer, [
    "answer", "expectedToken", "response", "audio", "correction", "correctionRecordId",
    "missCount", "supportLevel", "revealed", "selected", "intended"
  ]);
  assert.throws(() => completeStoryTransferCorrectionModel(modeled.nextState, run.identity),
    /model|stage|consumed/i, "the same story model cannot run twice");
  assert.deepEqual({
    targetId: modeled.challenge.targetId,
    optionTokens: modeled.challenge.optionTokens,
    expectedToken: modeled.challenge.expectedToken,
    instructionId: modeled.challenge.instructionId,
    powerId: modeled.challenge.powerId,
    expectedAction: modeled.challenge.expectedAction,
    recordsDomain: modeled.challenge.recordsDomain,
    connectedTextId: modeled.challenge.connectedTextId,
    bossTransferId: modeled.challenge.bossTransferId
  }, stableChallenge, "model consumption changed target/options/private key/action");
  const reloadedModeledState = normalizeSoundSeekersState(
    JSON.parse(JSON.stringify(modeled.nextState))
  );
  const reloadedModeled = resumeStoryTransferTransaction(
    reloadedModeledState, run.identity
  );
  const reloadedModeledChallenge = materializeStoryTransferChallenge(
    reloadedModeledState, run.identity
  );
  assert.equal(reloadedModeled.attempt.attemptId, beforeModel.attemptId);
  assert.equal(reloadedModeled.attempt.supportLevel, 3);
  assert.equal(reloadedModeled.attempt.revealed, true);
  assert.deepEqual(reloadedModeled.correction, modeled.correction);
  assert.deepEqual({
    targetId: reloadedModeledChallenge.targetId,
    optionTokens: reloadedModeledChallenge.optionTokens,
    expectedToken: reloadedModeledChallenge.expectedToken,
    instructionId: reloadedModeledChallenge.instructionId,
    powerId: reloadedModeledChallenge.powerId,
    expectedAction: reloadedModeledChallenge.expectedAction,
    recordsDomain: reloadedModeledChallenge.recordsDomain,
    connectedTextId: reloadedModeledChallenge.connectedTextId,
    bossTransferId: reloadedModeledChallenge.bossTransferId
  }, stableChallenge, "post-model reload changed target/options/private key/action");
  assert.throws(() => completeStoryTransferCorrectionModel(
    reloadedModeledState, run.identity
  ), /model|stage|consumed/i, "the same story model cannot run after reload");
  const supportedMiss = completeStoryTransferTransaction(reloadedModeledState, {
    ...run.identity,
    challenge: reloadedModeledChallenge,
    response: {
      kind: "literacy-answer",
      token: reloadedModeledChallenge.optionTokens.find(
        token => token !== reloadedModeledChallenge.expectedToken
      )
    },
    audio: { status: "completed" },
    at: "2026-09-02T02:00:04.000Z",
    sessionDay: "2026-09-02"
  });
  assert.equal(supportedMiss.outcome, "retry");
  assert.equal(supportedMiss.event.supportLevel, 3);
  assert.equal(supportedMiss.event.revealed, true);
  assert.equal(supportedMiss.nextState.checkpoint.storyTransfer.stage, "response_pending");
  assert.throws(() => completeStoryTransferCorrectionModel(
    supportedMiss.nextState, run.identity
  ), /model|stage|third/i, "a later story miss cannot trigger a second model");
  const challenge = materializeStoryTransferChallenge(supportedMiss.nextState, run.identity);
  const completed = completeStoryTransferTransaction(supportedMiss.nextState, {
    ...run.identity,
    challenge,
    response: { kind: "literacy-answer", token: challenge.expectedToken },
    audio: { status: "completed" },
    at: "2026-09-02T02:00:05.000Z",
    sessionDay: "2026-09-02"
  });
  assert.equal(completed.event.supportLevel, 3);
  assert.equal(completed.event.revealed, true);
  assert.equal(evidenceIsIndependent(completed.event), false);
  assert.equal(validContentDeckUses(completed.nextState, "stories").length, 1);
  assert.equal(validContentDeckUses(completed.nextState, "transfer").length, 1);
  assert.equal(validAttemptReceipts(completed.nextState).length, 5);
});

test("state normalization is structural while transaction APIs reject fabricated model history", () => {
  const placement = beginCanonicalAlternativePlacement("s16-alternative");
  for (const stage of ["model_pending", "response_pending"]) {
    const current = placement.state.checkpoint.contentPlacement;
    const fabricatedDescriptor = {
      ...current,
      stage,
      attemptOrdinal: 3,
      attemptId: `content-placement-attempt:${current.visitId}:${current.placementId}:${current.targetOrdinal}:3`
    };
    const structurallyNormalized = normalizeSoundSeekersState({
      ...placement.state,
      checkpoint: {
        ...placement.state.checkpoint,
        contentPlacement: fabricatedDescriptor
      }
    });
    assert.deepEqual(structurallyNormalized.checkpoint.contentPlacement, fabricatedDescriptor,
      `${stage}: lower state layer should only normalize exact shape`);
    assert.throws(() => resumeContentPlacementAttempt(
      structurallyNormalized, placement.identity
    ), /history|receipt|correction|stage/i);
    assert.throws(() => completeContentPlacementCorrectionModel(
      structurallyNormalized, placement.identity
    ), /history|receipt|third|model/i);
  }

  const story = beginCanonicalStoryTransaction("s1");
  for (const stage of ["model_pending", "response_pending"]) {
    const current = story.state.checkpoint.storyTransfer;
    const fabricatedDescriptor = {
      ...current,
      stage,
      attemptOrdinal: 3,
      attemptId: `story-transfer-attempt:${current.transactionId}:3`
    };
    const structurallyNormalized = normalizeSoundSeekersState({
      ...story.state,
      checkpoint: {
        ...story.state.checkpoint,
        storyTransfer: fabricatedDescriptor
      }
    });
    assert.deepEqual(structurallyNormalized.checkpoint.storyTransfer, fabricatedDescriptor,
      `${stage}: lower state layer should only normalize exact shape`);
    assert.throws(() => resumeStoryTransferTransaction(
      structurallyNormalized, story.identity
    ), /history|receipt|correction|stage/i);
    assert.throws(() => completeStoryTransferCorrectionModel(
      structurallyNormalized, story.identity
    ), /history|receipt|third|model/i);
  }
});

test("s6 rehydrates one visit and drives both real bindings through child evidence", () => {
  const expedition = getExpedition("s6");
  const owner = expedition.heartWordOpportunities.find(item => item.id === "s6-heart-1");
  const shared = expedition.phases.find(item => item.id === "s6-primary");
  let served = serveContentDeck(createContentDeckState(), {
    binding: owner.contentBinding,
    visitId: "journey-1:s6-heart-1",
    stopId: "s6",
    journeyStep: 6,
    seed: 6
  });
  assert.equal(served.ownerActivityType, "encoding");
  assert.ok(served.eligibleActivityTypes.includes("heart_part_mapping"));

  const registeredCheckpoint = checkpointContentDecks(served.nextState);
  const serializedCheckpoint = JSON.stringify(registeredCheckpoint);
  assert.equal(serializedCheckpoint.includes("answerTokensByActivity"), false);
  assert.equal(serializedCheckpoint.includes("eligibleActivityTypes"), false);
  assert.equal(serializedCheckpoint.includes('"nextState"'), false);
  served = null;
  let resumed = resumeContentDecks(registeredCheckpoint);
  let rehydrated = rehydrateServedContentInstance(resumed, {
    category: "heartWords", visitId: "journey-1:s6-heart-1"
  });
  assert.ok(rehydrated);
  const ownerVisitId = rehydrated.visitId;
  let ownerInputs = projectBoundContentResolverInputs(rehydrated);
  assert.deepEqual(Object.keys(ownerInputs).sort(), ["catalogRecord", "servedInstance"]);
  assert.strictEqual(ownerInputs.servedInstance, rehydrated);
  assert.deepEqual(Object.keys(ownerInputs.servedInstance).sort(), [
    "answerTokensByActivity", "category", "contentId", "contentInstanceId", "eligibleActivityTypes",
    "journeyStep", "nextState", "ownerActionUseId", "ownerActivityType", "recordId", "slotId",
    "stopId", "targetId", "visitId", "visitOwnerId", "wordId"
  ]);
  assert.deepEqual(Object.keys(ownerInputs.catalogRecord).sort(), [
    "answerTokensByActivity", "category", "contentId", "display", "eligibleActivityTypes", "heartParts",
    "introductionSlotId", "introductionStopId", "meaningId", "pronunciationId", "recordId", "regularParts",
    "slotIds", "targetId", "wordId"
  ]);
  assert.strictEqual(
    ownerInputs.catalogRecord,
    getContentDeckCatalogRecord("heartWords", rehydrated.recordId)
  );
  assert.doesNotThrow(() => validateBoundContentDecisionSource(ownerInputs));
  const ownerChallenge = {
    ...resolveBoundContentDecision(owner, ownerInputs),
    attemptId: "attempt-s6-heart-owner"
  };
  const ownerView = toChildChallengeView(ownerChallenge);
  assert.equal(assertInstructionMatchesChallenge(
    getInstructionContract(ownerChallenge.instructionId), ownerChallenge
  ), true);
  assert.equal(ownerView.activityType, "encoding");
  assert.equal(Object.hasOwn(ownerView, "expectedToken"), false);
  const ownerEvent = createLiteracyDecision({
    challenge: ownerChallenge,
    response: { kind: "literacy-answer", token: ownerChallenge.expectedToken },
    audio: { status: "completed" },
    journeyStep: 6,
    ordinal: 0,
    at: "2026-09-02T00:00:00.000Z",
    sessionDay: "2026-09-02"
  });
  assert.deepEqual(
    { domain: ownerEvent.domain, activityType: ownerEvent.activityType, correct: ownerEvent.correct },
    { domain: "heart_word_mapping", activityType: "encoding", correct: true }
  );
  assert.throws(
    () => recordContentDeckUse(resumed, rehydrated, shared.contentBinding),
    /owner use/i
  );
  const afterOwner = recordContentDeckUse(resumed, rehydrated, owner.contentBinding);
  const checkpoint = checkpointContentDecks(afterOwner);
  const serializedAfterOwnerCheckpoint = JSON.stringify(checkpoint);
  assert.equal(serializedAfterOwnerCheckpoint.includes("answerTokensByActivity"), false);
  assert.equal(serializedAfterOwnerCheckpoint.includes('"nextState"'), false);
  rehydrated = null;
  ownerInputs = null;
  assert.equal(rehydrated, null);
  assert.equal(ownerInputs, null);
  resumed = resumeContentDecks(checkpoint);
  const sharedServed = rehydrateServedContentInstance(resumed, {
    category: "heartWords", visitId: "journey-1:s6-heart-1"
  });
  const sharedChallenge = {
    ...resolveBoundContentDecision(shared, projectBoundContentResolverInputs(sharedServed)),
    attemptId: "attempt-s6-heart-shared"
  };
  const sharedView = toChildChallengeView(sharedChallenge);
  assert.equal(assertInstructionMatchesChallenge(
    getInstructionContract(sharedChallenge.instructionId), sharedChallenge
  ), true);
  assert.equal(sharedView.activityType, "heart_part_mapping");
  assert.equal(Object.hasOwn(sharedView, "expectedToken"), false);
  const sharedEvent = createLiteracyDecision({
    challenge: sharedChallenge,
    response: { kind: "literacy-answer", token: sharedChallenge.expectedToken },
    audio: { status: "completed" },
    journeyStep: 6,
    ordinal: 0,
    at: "2026-09-02T00:01:00.000Z",
    sessionDay: "2026-09-02"
  });
  assert.deepEqual(
    { domain: sharedEvent.domain, activityType: sharedEvent.activityType, correct: sharedEvent.correct },
    { domain: "heart_word_mapping", activityType: "heart_part_mapping", correct: true }
  );
  assert.equal(sharedServed.visitId, ownerVisitId);
  assert.notEqual(sharedChallenge.actionUseId, ownerChallenge.actionUseId);
  const afterShared = recordContentDeckUse(resumed, sharedServed, shared.contentBinding);
  const afterSharedState = createSoundSeekersState({ contentDecks: afterShared });
  assert.equal(validContentDeckVisits(afterShared, "heartWords").length, 1);
  assert.deepEqual(validContentDeckUses(afterSharedState, "heartWords").map(use => use.actionUseId).sort(),
    [shared.contentBinding.actionUseId, owner.contentBinding.actionUseId].sort());
  assert.deepEqual(validContentDeckUses(afterSharedState, "heartWords").map(use => use.activityType).sort(),
    ["encoding", "heart_part_mapping"]);
  assert.equal(deriveContentDeckRecordStats(
    afterSharedState, "heartWords", sharedServed.recordId
  ).useCount, 2);

  const ownerUseId = `${sharedServed.visitId}:${owner.contentBinding.actionUseId}`;
  const sharedUseId = `${sharedServed.visitId}:${shared.contentBinding.actionUseId}`;
  const ownerBranch = createContentDeckState({ heartWords: {
    visits: afterShared.heartWords.visits,
    uses: { [ownerUseId]: afterShared.heartWords.uses[ownerUseId] }
  } });
  const orphanBranch = createContentDeckState({ heartWords: {
    visits: afterShared.heartWords.visits,
    uses: { [sharedUseId]: afterShared.heartWords.uses[sharedUseId] }
  } });
  assert.equal(validContentDeckUses(
    createSoundSeekersState({ contentDecks: orphanBranch }), "heartWords"
  ).length, 0);
  const reunited = mergeContentDeckState(ownerBranch, orphanBranch);
  assert.deepEqual(
    validContentDeckUses(
      createSoundSeekersState({ contentDecks: reunited }), "heartWords"
    ).map(use => use.useId).sort(),
    [ownerUseId, sharedUseId].sort()
  );
  assert.deepEqual(reunited, mergeContentDeckState(orphanBranch, ownerBranch));
});

test("rehydration rejects every invalid persisted identity instead of trusting a served snapshot", () => {
  const expedition = getExpedition("s6");
  const owner = expedition.heartWordOpportunities.find(item => item.id === "s6-heart-1");
  const original = serveContentDeck(createContentDeckState(), {
    binding: owner.contentBinding,
    visitId: "journey-1:s6-heart-1",
    stopId: "s6",
    journeyStep: 6,
    seed: 6
  });
  const checkpoint = checkpointContentDecks(original.nextState);
  const invalidByField = {
    category: "stories",
    slotId: "heart-slot-s6-2",
    contentInstanceId: "heart-content-instance:heart-slot-s6-2",
    visitId: "journey-1:wrong-visit",
    visitOwnerId: "s6-heart-2",
    ownerActionUseId: "s6-heart-2:content-use",
    stopId: "s7",
    journeyStep: 0,
    recordId: "hw:not-in-catalog",
    contentId: "heart-word:not-the-record",
    targetId: "hw:not-the-record",
    wordId: "not-the-record",
    ownerActivityType: "recognition"
  };
  for (const [field, invalidValue] of Object.entries(invalidByField)) {
    const tampered = structuredClone(checkpoint);
    tampered.heartWords.visits[original.visitId][field] = invalidValue;
    const resumed = resumeContentDecks(tampered);
    assert.equal(
      rehydrateServedContentInstance(resumed, {
        category: "heartWords", visitId: original.visitId
      }),
      null,
      field
    );
  }
});

test("a later s6 replay records owner and shared uses with fresh immutable IDs", () => {
  const expedition = getExpedition("s6");
  const owner = expedition.heartWordOpportunities.find(item => item.id === "s6-heart-1");
  const shared = expedition.phases.find(item => item.id === "s6-primary");
  const completeVisit = (state, { visitId, journeyStep, seed }) => {
    const initial = serveContentDeck(state, {
      binding: owner.contentBinding, visitId, stopId: "s6", journeyStep, seed
    });
    let hydrated = rehydrateServedContentInstance(initial.nextState, { category: "heartWords", visitId });
    const afterOwner = recordContentDeckUse(initial.nextState, hydrated, owner.contentBinding);
    hydrated = null;
    const sharedHydrated = rehydrateServedContentInstance(afterOwner, { category: "heartWords", visitId });
    const afterShared = recordContentDeckUse(afterOwner, sharedHydrated, shared.contentBinding);
    return { state: afterShared, served: sharedHydrated };
  };

  const first = completeVisit(createContentDeckState(), {
    visitId: "journey-step-6:s6-heart-1", journeyStep: 6, seed: 6
  });
  const identicalRetry = recordContentDeckUse(first.state, first.served, shared.contentBinding);
  assert.deepEqual(identicalRetry, first.state);
  assert.throws(() => serveContentDeck(first.state, {
    binding: owner.contentBinding,
    visitId: "duplicate-step-6:s6-heart-1",
    stopId: "s6",
    journeyStep: 6,
    seed: 7
  }), /content instance.*journey step/i);
  const replay = completeVisit(first.state, {
    visitId: "journey-step-46:s6-heart-1", journeyStep: 46, seed: 46
  });
  assert.equal(first.served.contentInstanceId, replay.served.contentInstanceId);
  assert.notEqual(first.served.visitId, replay.served.visitId);
  const replayState = createSoundSeekersState({ contentDecks: replay.state });
  const uses = validContentDeckUses(replayState, "heartWords")
    .filter(use => use.contentInstanceId === first.served.contentInstanceId);
  assert.deepEqual(uses.map(use => [use.journeyStep, use.activityType]).sort(), [
    [6, "encoding"], [6, "heart_part_mapping"],
    [46, "encoding"], [46, "heart_part_mapping"]
  ]);
  assert.deepEqual(new Set(uses.map(use => use.useId)), new Set([
    `journey-step-6:s6-heart-1:${owner.contentBinding.actionUseId}`,
    `journey-step-6:s6-heart-1:${shared.contentBinding.actionUseId}`,
    `journey-step-46:s6-heart-1:${owner.contentBinding.actionUseId}`,
    `journey-step-46:s6-heart-1:${shared.contentBinding.actionUseId}`
  ]));
  for (const recordId of new Set(uses.map(use => use.recordId))) {
    const recordUses = uses.filter(use => use.recordId === recordId);
    const stats = deriveContentDeckRecordStats(replayState, "heartWords", recordId);
    assert.equal(stats.useCount, recordUses.length);
    assert.equal(stats.firstServedStep, Math.min(...recordUses.map(use => use.journeyStep)));
    assert.equal(stats.lastServedStep, Math.max(...recordUses.map(use => use.journeyStep)));
    for (const activityType of ["encoding", "heart_part_mapping"]) {
      const activityUses = recordUses.filter(use => use.activityType === activityType);
      assert.equal(stats.activityCounts[activityType], activityUses.length);
      assert.equal(stats.activityLastServed[activityType], Math.max(...activityUses.map(use => use.journeyStep)));
    }
  }
});

test("checkpoint resume gives every category the identical next serve", () => {
  for (const category of CONTENT_DECK_CATEGORIES) {
    const before = stateAfterRecordedVisits(category);
    const input = nextEligibleSlotInput(category, { seed: 37 });
    assert.deepEqual(
      serveContentDeck(resumeContentDecks(checkpointContentDecks(before)), input),
      serveContentDeck(before, input)
    );
  }
});

test("multi-activity ranking uses aggregate count, then the worst and oldest requirement", () => {
  const records = ["hw:the", "hw:was", "hw:said", "hw:some"]
    .map(recordId => getContentDeckCatalogRecord("heartWords", recordId));
  const deck = heartDeckWithActivityHistory({
    "hw:the": { encoding: [10], heart_part_mapping: [] },
    "hw:was": { encoding: [4, 12], heart_part_mapping: [] },
    "hw:said": { encoding: [8], heart_part_mapping: [3] },
    "hw:some": { encoding: [8], heart_part_mapping: [7] }
  });
  const context = {
    category: "heartWords",
    slotId: "heart-slot-s6-1",
    journeyStep: 46,
    requiredActivityTypes: ["encoding", "heart_part_mapping"],
    seed: 19
  };
  const ranked = rankContentDeckCandidates(records, deck, context).map(record => record.recordId);
  assert.deepEqual(ranked, ["hw:the", "hw:was", "hw:said", "hw:some"]);
  assert.deepEqual(
    rankContentDeckCandidates([...records].reverse(), deck, context).map(record => record.recordId),
    ranked
  );
});

test("heart-word activity subtype survives the child challenge and evidence boundary", () => {
  const challenge = heartWordChallenge({ activityType: "encoding" });
  assert.equal(toChildChallengeView(challenge).activityType, "encoding");
  const missingActivity = { ...challenge };
  delete missingActivity.activityType;
  assert.equal(validateQuestChallenge(missingActivity).valid, false);
  assert.equal(validateQuestChallenge({ ...challenge, activityType: "not-an-activity" }).valid, false);
  const event = createLiteracyDecision(validDecisionInput(challenge));
  assert.equal(event.domain, "heart_word_mapping");
  assert.equal(event.activityType, "encoding");
  assert.notEqual(event.domain, "phoneme_to_grapheme");
  const nonHeartInput = validNonHeartDecisionInput();
  assert.equal(validateQuestChallenge({
    ...nonHeartInput.challenge,
    activityType: "encoding"
  }).valid, false);
  const nonHeart = createLiteracyDecision(nonHeartInput);
  assert.equal(Object.hasOwn(nonHeart, "activityType"), false);
});

test("concurrent immutable visits and uses merge without derived-field drift", () => {
  const local = stateWithHeartWordUse("hw:the", "recognition", "visit-local", "use-local", 4);
  const remote = stateWithHeartWordUse("hw:the", "encoding", "visit-remote", "use-remote", 9);
  const merged = mergeSoundSeekersStates(local, remote);
  const stats = deriveContentDeckRecordStats(merged, "heartWords", "hw:the");
  assert.deepEqual({
    firstServedStep: stats.firstServedStep,
    lastServedStep: stats.lastServedStep,
    useCount: stats.useCount,
    activityCounts: stats.activityCounts,
    activityLastServed: stats.activityLastServed
  }, {
    firstServedStep: 4,
    lastServedStep: 9,
    useCount: 2,
    activityCounts: { recognition: 1, encoding: 1 },
    activityLastServed: { recognition: 4, encoding: 9 }
  });
});

test("immutable conflict markers absorb every merge order and never enter statistics", () => {
  const visit = validHeartVisit({
    visitId: "visit-conflict", recordId: "hw:the", ownerActivityType: "encoding", journeyStep: 6
  });
  const divergentVisit = { ...visit, recordId: "hw:was", contentId: "heart-word:was", targetId: "hw:was", wordId: "was" };
  const use = validHeartUse({
    useId: "visit-conflict:s6-heart-1:content-use",
    visitId: visit.visitId,
    recordId: "hw:the",
    activityType: "encoding",
    journeyStep: 6
  });
  const divergentUse = { ...use, recordId: "hw:was" };
  const a = createContentDeckState({ heartWords: { visits: { [visit.visitId]: visit }, uses: { [use.useId]: use } } });
  const b = createContentDeckState({ heartWords: { visits: { [visit.visitId]: divergentVisit }, uses: { [use.useId]: divergentUse } } });
  const c = createContentDeckState({ heartWords: { visits: { [visit.visitId]: { ...visit, ownerActivityType: " encoding ", ignored: true } }, uses: { [use.useId]: { ...use, activityType: " encoding ", ignored: true } } } });
  const left = mergeContentDeckState(mergeContentDeckState(a, b), c);
  const right = mergeContentDeckState(a, mergeContentDeckState(b, c));
  assert.deepEqual(left, right);
  assert.deepEqual(mergeContentDeckState(a, b), mergeContentDeckState(b, a));
  assert.deepEqual(left.heartWords.visits[visit.visitId], {
    kind: "visit_conflict", visitId: "visit-conflict"
  });
  assert.deepEqual(left.heartWords.uses[use.useId], {
    kind: "use_conflict", useId: "visit-conflict:s6-heart-1:content-use"
  });
  assert.deepEqual(mergeContentDeckState(left, a), left);
  assert.equal(deriveContentDeckRecordStats(
    createSoundSeekersState({ contentDecks: left }), "heartWords", "hw:the"
  ).useCount, 0);

  const nonHeart = createContentDeckState({ stories: { visits: {
    "story-visit": { ...validStoryVisit({ visitId: "story-visit" }), ownerActivityType: "encoding" }
  }, uses: {} } });
  assert.equal(Object.hasOwn(nonHeart.stories.visits["story-visit"], "ownerActivityType"), false);
  const invalidHeart = createContentDeckState({ heartWords: { visits: {
    "bad-heart-visit": { ...visit, visitId: "bad-heart-visit", ownerActivityType: "not-an-activity" }
  }, uses: {} } });
  assert.deepEqual(invalidHeart.heartWords.visits["bad-heart-visit"], {
    kind: "visit_conflict", visitId: "bad-heart-visit"
  });

  const structuralA = createContentDeckState({ heartWords: { visits: {
    "structural-a": validHeartVisit({ visitId: "structural-a", journeyStep: 6 })
  }, uses: {} } });
  const structuralB = createContentDeckState({ heartWords: { visits: {
    "structural-b": validHeartVisit({ visitId: "structural-b", journeyStep: 6 })
  }, uses: {} } });
  const duplicateClaim = mergeContentDeckState(structuralA, structuralB);
  assert.equal(validContentDeckVisits(duplicateClaim, "heartWords").length, 0);
  assert.equal(rehydrateServedContentInstance(duplicateClaim, {
    category: "heartWords", visitId: "structural-a"
  }), null);
  assert.equal(rehydrateServedContentInstance(duplicateClaim, {
    category: "heartWords", visitId: "structural-b"
  }), null);
  assert.equal(deriveContentDeckRecordStats(
    createSoundSeekersState({ contentDecks: duplicateClaim }), "heartWords", "hw:the"
  ).useCount, 0);
});

test("JS composite-pair normalization restores halves and matches the SQL merge contract", () => {
  const literalPair = ({ stopId, journeyStep, boss, storyToken, transferToken }) => {
    const transactionId = `merge-fixture:${journeyStep}:${stopId}`;
    const storyVisitId = `visit:${transactionId}:story`;
    const transferVisitId = `visit:${transactionId}:transfer`;
    const storyUseId = `${storyVisitId}:${stopId}-story:content-use`;
    const transferUseId = `${transferVisitId}:${stopId}-transfer:content-use`;
    const attemptId = `story-transfer-attempt:${transactionId}:0`;
    const evidenceEventId = `${attemptId}:0`;
    const storyVisit = {
      kind: "visit", visitId: storyVisitId,
      contentInstanceId: `stories-content-instance:story-slot-${stopId}`,
      visitOwnerId: `${stopId}-story`, ownerActionUseId: `${stopId}-story:content-use`,
      category: "stories", slotId: `story-slot-${stopId}`,
      recordId: `story:scene-${stopId}`, contentId: `scene-${stopId}`,
      targetId: `text:scene-${stopId}`, wordId: null, stopId, journeyStep
    };
    const transferVisit = {
      kind: "visit", visitId: transferVisitId,
      contentInstanceId: `transfer-content-instance:transfer-slot-${stopId}`,
      visitOwnerId: `${stopId}-transfer`, ownerActionUseId: `${stopId}-transfer:content-use`,
      category: "transfer", slotId: `transfer-slot-${stopId}`,
      recordId: `transfer:${stopId}`, contentId: `transfer:${stopId}`,
      targetId: boss ? `boss:novel:${stopId}` : `text:scene-${stopId}`,
      wordId: boss ? "cat" : null, stopId, journeyStep
    };
    const storyUse = {
      kind: "use", useId: storyUseId, visitId: storyVisitId,
      contentInstanceId: storyVisit.contentInstanceId, visitOwnerId: storyVisit.visitOwnerId,
      actionUseId: storyVisit.ownerActionUseId, category: "stories",
      slotId: storyVisit.slotId, recordId: storyVisit.recordId, journeyStep,
      transactionId, pairedUseId: transferUseId, evidenceEventId,
      narrativeChoiceToken: storyToken, attemptReceiptIds: [attemptId]
    };
    const transferUse = {
      kind: "use", useId: transferUseId, visitId: transferVisitId,
      contentInstanceId: transferVisit.contentInstanceId, visitOwnerId: transferVisit.visitOwnerId,
      actionUseId: transferVisit.ownerActionUseId, category: "transfer",
      slotId: transferVisit.slotId, recordId: transferVisit.recordId, journeyStep,
      transactionId, pairedUseId: storyUseId, evidenceEventId,
      narrativeChoiceToken: transferToken, attemptReceiptIds: [attemptId]
    };
    const event = literalValidStoryEvidence({
      id: evidenceEventId, attemptId, stopId, boss, journeyStep, correct: true,
      supportLevel: 0, revealed: false
    });
    const receipt = {
      kind: "attempt_receipt", attemptId, operation: "story_transfer", subjectId: transactionId,
      decisionOrdinal: 0, attemptOrdinal: 0, inputSha256: "a".repeat(64), completed: true,
      correctionRecordIds: [], eventIds: [evidenceEventId], useIds: [storyUseId, transferUseId]
    };
    return { storyVisit, transferVisit, storyUse, transferUse, event, receipt };
  };
  const stateFrom = ({ storyVisit, transferVisit, storyUse, transferUse, event, receipt }, {
    includeStory = true, includeTransfer = true
  } = {}) => createSoundSeekersState({
    contentDecks: {
      stories: {
        visits: includeStory ? { [storyVisit.visitId]: storyVisit } : {},
        uses: includeStory ? { [storyUse.useId]: storyUse } : {}
      },
      transfer: {
        visits: includeTransfer ? { [transferVisit.visitId]: transferVisit } : {},
        uses: includeTransfer ? { [transferUse.useId]: transferUse } : {}
      }
    },
    evidence: [event],
    attemptReceipts: { [receipt.attemptId]: receipt }
  });
  const assertPairValidity = (state, expectedCount, expectedToken) => {
    const stories = validContentDeckUses(state, "stories");
    const transfers = validContentDeckUses(state, "transfer");
    assert.equal(stories.length, expectedCount);
    assert.equal(transfers.length, expectedCount);
    if (expectedCount === 1) {
      assert.equal(stories[0].narrativeChoiceToken, expectedToken);
      assert.equal(transfers[0].narrativeChoiceToken, expectedToken);
      assert.equal(stories[0].pairedUseId, transfers[0].useId);
      assert.equal(transfers[0].pairedUseId, stories[0].useId);
    }
  };

  const boss = literalPair({
    stopId: "s5", journeyStep: 5, boss: true,
    storyToken: "  narrative-s5-left  ", transferToken: "narrative-s5-left"
  });
  const bossStoryHalf = stateFrom(boss, { includeTransfer: false });
  const bossTransferHalf = stateFrom(boss, { includeStory: false });
  assertPairValidity(bossStoryHalf, 0);
  assertPairValidity(bossTransferHalf, 0);
  for (const [left, right] of [
    [bossStoryHalf, bossTransferHalf], [bossTransferHalf, bossStoryHalf]
  ]) {
    assertPairValidity(mergeSoundSeekersStates(left, right), 1, "narrative-s5-left");
  }
  const bossCanonical = stateFrom(boss);
  assert.deepEqual(
    mergeSoundSeekersStates(mergeSoundSeekersStates(bossStoryHalf, bossTransferHalf), bossCanonical),
    mergeSoundSeekersStates(bossStoryHalf, mergeSoundSeekersStates(bossTransferHalf, bossCanonical))
  );

  for (const invalidToken of [null, "   "]) {
    const invalidBoss = stateFrom(literalPair({
      stopId: "s5", journeyStep: 5, boss: true,
      storyToken: invalidToken, transferToken: invalidToken
    }));
    assertPairValidity(invalidBoss, 0);
  }
  const nonBossWithToken = stateFrom(literalPair({
    stopId: "s1", journeyStep: 1, boss: false,
    storyToken: "forbidden", transferToken: "forbidden"
  }));
  assertPairValidity(nonBossWithToken, 0);
  const mismatch = stateFrom(literalPair({
    stopId: "s5", journeyStep: 5, boss: true,
    storyToken: "narrative-s5-left", transferToken: "narrative-s5-right"
  }));
  assertPairValidity(mismatch, 0);

  const missingTokenPair = literalPair({
    stopId: "s5", journeyStep: 5, boss: true,
    storyToken: "narrative-s5-left", transferToken: "narrative-s5-left"
  });
  delete missingTokenPair.storyUse.narrativeChoiceToken;
  const missing = stateFrom(missingTokenPair);
  assert.deepEqual(missing.contentDecks.stories.uses[missingTokenPair.storyUse.useId], {
    kind: "use_conflict", useId: missingTokenPair.storyUse.useId
  });
  for (const laterValid of [bossCanonical, bossStoryHalf]) {
    const forward = mergeSoundSeekersStates(missing, laterValid);
    const reverse = mergeSoundSeekersStates(laterValid, missing);
    assert.deepEqual(forward, reverse);
    assert.deepEqual(forward.contentDecks.stories.uses[missingTokenPair.storyUse.useId], {
      kind: "use_conflict", useId: missingTokenPair.storyUse.useId
    });
    assertPairValidity(forward, 0);
  }
  assert.deepEqual(
    mergeSoundSeekersStates(mergeSoundSeekersStates(missing, bossCanonical), bossStoryHalf),
    mergeSoundSeekersStates(missing, mergeSoundSeekersStates(bossCanonical, bossStoryHalf))
  );

  const nonBoss = literalPair({
    stopId: "s1", journeyStep: 1, boss: false, storyToken: null, transferToken: null
  });
  const nonBossStoryHalf = stateFrom(nonBoss, { includeTransfer: false });
  const nonBossTransferHalf = stateFrom(nonBoss, { includeStory: false });
  assertPairValidity(mergeSoundSeekersStates(nonBossStoryHalf, nonBossTransferHalf), 1, null);
  assert.deepEqual(
    mergeSoundSeekersStates(mergeSoundSeekersStates(nonBossStoryHalf, nonBossTransferHalf), stateFrom(nonBoss)),
    mergeSoundSeekersStates(nonBossStoryHalf, mergeSoundSeekersStates(nonBossTransferHalf, stateFrom(nonBoss)))
  );
});

test("answer-safe attempt receipts merge by immutable ID and absorb divergence", () => {
  const attemptId = "story-transfer-attempt:story-transfer:1:s1:0";
  const receipt = {
    kind: "attempt_receipt", attemptId, operation: "story_transfer",
    subjectId: "story-transfer:1:s1", decisionOrdinal: 0, attemptOrdinal: 0,
    inputSha256: "a".repeat(64), completed: true, correctionRecordIds: [],
    eventIds: [`${attemptId}:0`],
    useIds: ["visit:story-transfer:1:s1:story:s1-story:content-use",
      "visit:story-transfer:1:s1:transfer:s1-transfer:content-use"]
  };
  const normalized = createSoundSeekersState({ attemptReceipts: {
    [attemptId]: { ...receipt, ignored: "discard-me" }
  } });
  assert.deepEqual(normalized.attemptReceipts[attemptId], receipt);
  const same = createSoundSeekersState({ attemptReceipts: { [attemptId]: receipt } });
  assert.deepEqual(mergeSoundSeekersStates(normalized, same).attemptReceipts[attemptId], receipt);

  const divergent = createSoundSeekersState({ attemptReceipts: {
    [attemptId]: { ...receipt, inputSha256: "b".repeat(64) }
  } });
  const conflict = mergeSoundSeekersStates(normalized, divergent);
  assert.deepEqual(conflict.attemptReceipts[attemptId], {
    kind: "attempt_receipt_conflict", attemptId
  });
  assert.deepEqual(mergeSoundSeekersStates(divergent, normalized), conflict);
  assert.deepEqual(mergeSoundSeekersStates(conflict, same), conflict);
  assert.deepEqual(
    mergeSoundSeekersStates(mergeSoundSeekersStates(normalized, divergent), same),
    mergeSoundSeekersStates(normalized, mergeSoundSeekersStates(divergent, same))
  );

  for (const malformed of [
    { ...receipt, inputSha256: "not-a-sha" },
    { ...receipt, correctionRecordIds: ["content-correction:a", "content-correction:a"] },
    { ...receipt, eventIds: [receipt.eventIds[0], receipt.eventIds[0]] },
    { ...receipt, operation: "unknown" },
    { ...receipt, attemptId: "different-key" }
  ]) {
    const state = createSoundSeekersState({ attemptReceipts: { [attemptId]: malformed } });
    assert.deepEqual(state.attemptReceipts[attemptId], {
      kind: "attempt_receipt_conflict", attemptId
    });
  }
});

test("coverage rehydrates canonical uses and excludes unauthorised but structurally valid raw records", () => {
  const expectedComplete = {
    complete: true,
    categories: {
      heartWords: { coveredRecordCount: 60, totalRecordCount: 60 },
      stories: { coveredRecordCount: 40, totalRecordCount: 40 },
      alternatives: { coveredRecordCount: 4, totalRecordCount: 4 },
      morphology: { coveredRecordCount: 1, totalRecordCount: 1 },
      transfer: { coveredRecordCount: 40, totalRecordCount: 40 }
    }
  };
  const canonicalState = completeCanonicalContentCoverageState();
  assert.deepEqual(Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [
    category, validContentDeckUses(canonicalState, category).length
  ])), { heartWords: 81, stories: 40, alternatives: 4, morphology: 1, transfer: 40 });
  const canonicalCoverage = coverageStatus(canonicalState);
  assert.deepEqual(canonicalCoverage, expectedComplete);
  assert.equal(Object.isFrozen(canonicalCoverage), true);
  assert.equal(Object.isFrozen(canonicalCoverage.categories), true);
  for (const category of CONTENT_DECK_CATEGORIES) {
    assert.equal(Object.isFrozen(canonicalCoverage.categories[category]), true);
  }

  const completedAlternativeReceipt = validAttemptReceipts(canonicalState).find(receipt =>
    receipt.operation === "content_placement"
    && receipt.subjectId === "s16-alternative"
    && receipt.completed);
  assert.ok(completedAlternativeReceipt);
  const divergentReceiptBranch = createSoundSeekersState({ attemptReceipts: {
    [completedAlternativeReceipt.attemptId]: {
      ...completedAlternativeReceipt,
      inputSha256: completedAlternativeReceipt.inputSha256 === "f".repeat(64)
        ? "e".repeat(64)
        : "f".repeat(64)
    }
  } });
  const receiptConflict = mergeSoundSeekersStates(canonicalState, divergentReceiptBranch);
  assert.deepEqual(receiptConflict.attemptReceipts[completedAlternativeReceipt.attemptId], {
    kind: "attempt_receipt_conflict",
    attemptId: completedAlternativeReceipt.attemptId
  });
  assert.equal(validAttemptReceipts(receiptConflict)
    .some(receipt => receipt.attemptId === completedAlternativeReceipt.attemptId), false);
  assert.equal(validContentDeckUses(receiptConflict, "alternatives").length, 3);
  assert.deepEqual(coverageStatus(receiptConflict).categories.alternatives,
    { coveredRecordCount: 3, totalRecordCount: 4 });
  assert.equal(coverageStatus(receiptConflict).complete, false);
  const absorbingRetry = mergeSoundSeekersStates(receiptConflict, canonicalState);
  assert.deepEqual(absorbingRetry.attemptReceipts[completedAlternativeReceipt.attemptId], {
    kind: "attempt_receipt_conflict",
    attemptId: completedAlternativeReceipt.attemptId
  });
  assert.equal(validContentDeckUses(absorbingRetry, "alternatives").length, 3);

  const completedAlternativeUseId = completedAlternativeReceipt.useIds[0];
  const completedAlternativeUse = canonicalState.contentDecks.alternatives
    .uses[completedAlternativeUseId];
  const completedAlternativeEventId = completedAlternativeReceipt.eventIds[0];
  const completedAlternativeEvent = canonicalState.evidence.find(
    event => event.id === completedAlternativeEventId
  );
  assert.ok(completedAlternativeUse);
  assert.ok(completedAlternativeEvent);

  const missingEvidence = normalizeSoundSeekersState({
    ...canonicalState,
    evidence: canonicalState.evidence.filter(event => event.id !== completedAlternativeEventId)
  });
  assert.equal(validContentDeckUses(missingEvidence, "alternatives").length, 3);
  assert.deepEqual(coverageStatus(missingEvidence).categories.alternatives,
    { coveredRecordCount: 3, totalRecordCount: 4 });
  const repairedEvidence = mergeSoundSeekersStates(missingEvidence,
    createSoundSeekersState({ evidence: [completedAlternativeEvent] }));
  assert.equal(validContentDeckUses(repairedEvidence, "alternatives").length, 4);
  assert.deepEqual(coverageStatus(repairedEvidence), expectedComplete,
    "an exact later missing event repairs its dangling receipt/use chain");

  const missingReceipt = normalizeSoundSeekersState({
    ...canonicalState,
    attemptReceipts: Object.fromEntries(Object.entries(canonicalState.attemptReceipts)
      .filter(([attemptId]) => attemptId !== completedAlternativeReceipt.attemptId))
  });
  assert.equal(validContentDeckUses(missingReceipt, "alternatives").length, 3);
  assert.deepEqual(coverageStatus(missingReceipt).categories.alternatives,
    { coveredRecordCount: 3, totalRecordCount: 4 });
  const repairedReceipt = mergeSoundSeekersStates(missingReceipt,
    createSoundSeekersState({ attemptReceipts: {
      [completedAlternativeReceipt.attemptId]: completedAlternativeReceipt
    } }));
  assert.equal(validContentDeckUses(repairedReceipt, "alternatives").length, 4);
  assert.deepEqual(coverageStatus(repairedReceipt), expectedComplete,
    "an exact later missing receipt repairs its dangling use/evidence chain");

  const evidenceConflict = mergeSoundSeekersStates(canonicalState,
    createSoundSeekersState({ evidence: [{
      ...completedAlternativeEvent,
      cueDelivery: completedAlternativeEvent.cueDelivery === "completed"
        ? "blocked"
        : "completed"
    }] }));
  assert.equal(validContentDeckUses(evidenceConflict, "alternatives").length, 3);
  assert.deepEqual(coverageStatus(evidenceConflict).categories.alternatives,
    { coveredRecordCount: 3, totalRecordCount: 4 });
  assert.equal(validContentDeckUses(
    mergeSoundSeekersStates(evidenceConflict, canonicalState), "alternatives"
  ).length, 3, "an absorbing evidence conflict cannot be repaired");

  const useConflict = mergeSoundSeekersStates(canonicalState,
    createSoundSeekersState({ contentDecks: { alternatives: {
      visits: {},
      uses: { [completedAlternativeUseId]: {
        ...completedAlternativeUse,
        journeyStep: completedAlternativeUse.journeyStep + 1
      } }
    } } }));
  assert.deepEqual(useConflict.contentDecks.alternatives.uses[completedAlternativeUseId], {
    kind: "use_conflict", useId: completedAlternativeUseId
  });
  assert.equal(validContentDeckUses(useConflict, "alternatives").length, 3);
  assert.deepEqual(coverageStatus(useConflict).categories.alternatives,
    { coveredRecordCount: 3, totalRecordCount: 4 });
  assert.equal(validContentDeckUses(
    mergeSoundSeekersStates(useConflict, canonicalState), "alternatives"
  ).length, 3, "an absorbing use conflict cannot be repaired");

  const unauthorised = structurallyValidUnauthorisedContentDeckFixture();
  for (const category of CONTENT_DECK_CATEGORIES) {
    assert.equal(validContentDeckVisits(unauthorised.contentDecks, category).length, 1, category);
    assert.equal(validContentDeckUses(unauthorised, category).length, 1, category);
    assert.equal(deriveContentDeckRecordStats(
      unauthorised, category, unauthorised.recordIds[category]
    ).useCount, 1, `${category}: structural statistics retain raw valid use`);
  }
  assert.deepEqual(coverageStatus(unauthorised), {
    complete: false,
    categories: {
      heartWords: { coveredRecordCount: 0, totalRecordCount: 60 },
      stories: { coveredRecordCount: 0, totalRecordCount: 40 },
      alternatives: { coveredRecordCount: 0, totalRecordCount: 4 },
      morphology: { coveredRecordCount: 0, totalRecordCount: 1 },
      transfer: { coveredRecordCount: 0, totalRecordCount: 40 }
    }
  });

  const merged = mergeSoundSeekersStates(canonicalState, unauthorised);
  for (const category of CONTENT_DECK_CATEGORIES) {
    const { visitId, useId } = unauthorised.entryIds[category];
    assert.deepEqual(merged.contentDecks[category].visits[visitId],
      unauthorised.contentDecks[category].visits[visitId], `${category}: raw visit preserved`);
    assert.deepEqual(merged.contentDecks[category].uses[useId],
      unauthorised.contentDecks[category].uses[useId], `${category}: raw use preserved`);
    assert.equal(deriveContentDeckRecordStats(
      merged, category, unauthorised.recordIds[category]
    ).useCount, 1, `${category}: merged structural statistics retain raw use`);
  }
  assert.deepEqual(coverageStatus(merged), expectedComplete,
    "unauthorised raw records cannot inflate canonical coverage");
});

test("client and SQL normalize activity before ID dedupe and preserve boundaries", () => {
  const migration = readFileSync(
    "supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql",
    "utf8"
  );
  const selftest = readFileSync(
    "supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql",
    "utf8"
  );
  for (const signature of [
    /lp_quest_normalize_v2_deck_visit\s*\(\s*category text\s*,\s*entry_id text\s*,\s*value jsonb\s*\)/u,
    /lp_quest_normalize_v2_deck_use\s*\(\s*category text\s*,\s*entry_id text\s*,\s*value jsonb\s*\)/u,
    /lp_quest_union_v2_deck_visits\s*\(\s*category text\s*,\s*left_visits jsonb\s*,\s*right_visits jsonb\s*\)/u,
    /lp_quest_union_v2_deck_uses\s*\(\s*category text\s*,\s*left_uses jsonb\s*,\s*right_uses jsonb\s*\)/u,
    /lp_quest_merge_v2_deck\s*\(\s*category text\s*,\s*left_deck jsonb\s*,\s*right_deck jsonb\s*\)/u,
    /lp_quest_merge_v2_content_decks\s*\(\s*left jsonb\s*,\s*right jsonb\s*\)/u,
    /lp_quest_valid_v2_attempt_receipts\s*\(\s*evidence jsonb\s*,\s*content_decks jsonb\s*,\s*attempt_receipts jsonb\s*\)/u,
    /lp_quest_valid_v2_content_decks\s*\(\s*content_decks jsonb\s*,\s*attempt_receipts jsonb\s*,\s*evidence jsonb\s*\)/u,
    /lp_quest_normalize_v2_attempt_receipt\s*\(\s*entry_id text\s*,\s*value jsonb\s*\)/u,
    /lp_quest_union_v2_attempt_receipts\s*\(\s*left_receipts jsonb\s*,\s*right_receipts jsonb\s*\)/u
  ]) assert.match(migration, signature);
  for (const category of ["heartWords", "stories", "alternatives", "morphology", "transfer"]) {
    assert.match(migration, new RegExp(`lp_quest_merge_v2_deck\\s*\\(\\s*'${category}'`, "u"));
  }
  assert.ok((migration.match(/lp_quest_merge_v2_content_decks\s*\(/gu) || []).length >= 2,
    "the helper must be defined and called by the overall learning merge");
  assert.match(selftest, /lp_quest_valid_v2_attempt_receipts\s*\(/u);
  assert.match(selftest, /lp_quest_valid_v2_content_decks\s*\(/u);
  assertNormalizationRunsBeforeEvidenceGrouping(migration);
  assertVisitOwnerActivityNormalizationRunsBeforeFingerprint(migration);
  assertUseActivityNormalizationRunsBeforeFingerprint(migration);
  assert.match(migration, /visit_conflict/u);
  assert.match(migration, /use_conflict/u);
  assertSqlSelfTestCoversAbsorbingAssociativeConflictMarkers(selftest);
  for (const requiredSelfTestToken of [
    "transactionId", "pairedUseId", "evidenceEventId", "narrativeChoiceToken",
    "attemptId", "attemptOrdinal", "contentPlacement",
    "attemptReceipts", "attempt_receipt", "attempt_receipt_conflict", "inputSha256",
    "decisionOrdinal", "correctionRecordIds", "receipt conflict invalidates dependent use",
    "story-transfer", "connected_text_transfer", "novel_decoding",
    "raw orphan retained", "reciprocal validity restored"
  ]) assert.match(selftest, new RegExp(requiredSelfTestToken, "u"));
  assertPreservesFoundationFunctionSignaturesRevokesAndGrants(migration);
});

test("the SQL gate has one literal bootstrap/prerequisite chain and accepts no caller target", () => {
  assert.deepEqual(SOUND_SEEKERS_CONTENT_DECK_SQL_FILES, Object.freeze([
    "supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql",
    "supabase/migrations/20260614090000_progress_forward_merge.sql",
    "supabase/migrations/20260715090000_phonics_quest_merge.sql",
    "supabase/migrations/20260901120000_sound_seekers_learning_v2.sql",
    "supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql",
    "supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql"
  ]));
  assert.doesNotThrow(() => assertNoSqlSelftestCliArguments([]));
  for (const args of [["target_db"], ["--database", "target_db"], ["postgresql://localhost/postgres"]]) {
    assert.throws(() => assertNoSqlSelftestCliArguments(args), /does not accept.*arguments|caller target/i);
  }
  const sanitized = sanitizedPostgresEnvironment({
    PATH: "/fixture/bin",
    LANG: "C",
    SOUND_SEEKERS_LOCAL_POSTGRES_ADMIN_URL: "postgresql://secret@remote.example/prod",
    SOUND_SEEKERS_TEST_DATABASE_URL: "postgresql://secret@remote.example/prod",
    DATABASE_URL: "postgresql://secret@remote.example/prod",
    PGHOST: "remote.example", PGPORT: "5432", PGDATABASE: "prod", PGUSER: "prod_user",
    PGPASSWORD: "secret", PGSERVICE: "prod", PGSERVICEFILE: "/secret/service",
    PGOPTIONS: "-c search_path=attacker", PGCLIENTENCODING: "LATIN1",
    PGDATESTYLE: "SQL, DMY", PGTZ: "Pacific/Honolulu", PGSSLMODE: "require",
    PGPASSFILE: "/secret/passfile", PGAPPNAME: "hostile-client"
  });
  assert.deepEqual(sanitized, { PATH: "/fixture/bin", LANG: "C" });
  assert.equal(Object.keys(sanitized).some(key => key.startsWith("PG")), false);
  for (const key of [
    "SOUND_SEEKERS_LOCAL_POSTGRES_ADMIN_URL", "SOUND_SEEKERS_TEST_DATABASE_URL", "DATABASE_URL"
  ]) assert.equal(Object.hasOwn(sanitized, key), false, key);

  const bootstrap = readFileSync(
    "supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql", "utf8"
  );
  assertBootstrapCreatesOnlyMinimalRolesAndStudentProgress(bootstrap);
});

test("the SQL runner owns one socket-only cluster and targets it explicitly for every command", () => {
  const root = "/fixture/lp-ss-AbC123";
  const data = `${root}/d`;
  const socket = `${root}/s`;
  const port = "24660";
  const database = "literacypath_sound_seekers_test_00112233445566778899aabb";
  const calls = [];
  const filesystem = [];
  const output = [];
  const errors = [];
  const randomValues = [
    Buffer.from([0x12, 0x34]),
    Buffer.from("00112233445566778899aabb", "hex")
  ];
  const hostileEnvironment = {
    PATH: "/fixture/bin", LANG: "C",
    SOUND_SEEKERS_LOCAL_POSTGRES_ADMIN_URL: "postgresql://secret@remote.example/prod",
    SOUND_SEEKERS_TEST_DATABASE_URL: "postgresql://secret@remote.example/prod",
    DATABASE_URL: "postgresql://secret@remote.example/prod",
    PGHOST: "remote.example", PGPORT: "9999", PGDATABASE: "prod", PGUSER: "attacker",
    PGPASSWORD: "do-not-print", PGSERVICE: "prod", PGSERVICEFILE: "/secret/service",
    PGOPTIONS: "-c search_path=attacker", PGCLIENTENCODING: "LATIN1",
    PGDATESTYLE: "SQL, DMY", PGTZ: "Pacific/Honolulu", PGSSLMODE: "require",
    PGPASSFILE: "/secret/passfile", PGAPPNAME: "hostile-client"
  };
  const result = runSoundSeekersContentDeckSqlSelftest({
    args: [],
    env: hostileEnvironment,
    randomBytes: size => {
      const value = randomValues.shift();
      assert.equal(value.length, size);
      return value;
    },
    tmpdir: () => "/fixture",
    mkdtemp: prefix => {
      assert.equal(prefix, "/fixture/lp-ss-");
      filesystem.push(["mkdtemp", prefix]);
      return root;
    },
    mkdir: (path, options) => filesystem.push(["mkdir", path, options]),
    remove: (path, options) => filesystem.push(["remove", path, options]),
    runCommand: (binary, args, options) => {
      calls.push([binary, [...args], { ...options, env: { ...options.env } }]);
      return { status: 0, stdout: "", stderr: "" };
    },
    stdout: message => output.push(message),
    stderr: message => errors.push(message)
  });
  assert.deepEqual(result, { status: "passed" });
  assert.deepEqual(calls.slice(0, 5).map(([binary, args]) => [binary, args]), [
    ["initdb", ["--version"]], ["pg_ctl", ["--version"]], ["psql", ["--version"]],
    ["createdb", ["--version"]], ["dropdb", ["--version"]]
  ]);
  assert.deepEqual(filesystem.slice(0, 2), [
    ["mkdtemp", "/fixture/lp-ss-"],
    ["mkdir", socket, { recursive: false, mode: 0o700 }]
  ]);
  assert.ok(Buffer.byteLength(`${socket}/.s.PGSQL.${port}.lock`, "utf8") <= 103);
  assert.deepEqual(calls[5].slice(0, 2), ["initdb", [
    "-D", data, "--auth=trust", "--username=postgres", "--no-locale", "--encoding=UTF8"
  ]]);
  assert.deepEqual(calls[6].slice(0, 2), ["pg_ctl", [
    "-D", data, "-w", "-o",
    `-k ${socket} -p ${port} -c listen_addresses='' -c unix_socket_permissions=0700`, "start"
  ]]);
  assert.deepEqual(calls[7].slice(0, 2), ["createdb", [
    "-h", socket, "-p", port, "-U", "postgres", database
  ]]);
  const fileCalls = calls.filter(([binary, args]) => binary === "psql" && args.includes("-f"));
  assert.deepEqual(fileCalls.map(([, args]) => args),
    SOUND_SEEKERS_CONTENT_DECK_SQL_FILES.map(file => [
      "-X", "--set=ON_ERROR_STOP=1", "-h", socket, "-p", port,
      "-U", "postgres", "-d", database, "-f", file
    ]));
  const terminate = calls.at(-3);
  assert.equal(terminate[0], "psql");
  assert.deepEqual(terminate[1].slice(0, 10), [
    "-X", "--set=ON_ERROR_STOP=1", "-h", socket, "-p", port,
    "-U", "postgres", "-d", "postgres"
  ]);
  assert.ok(terminate[1].includes(`database_name=${database}`));
  assert.match(terminate[1].at(-1), /pg_terminate_backend/u);
  assert.deepEqual(calls.at(-2).slice(0, 2), ["dropdb", [
    "-h", socket, "-p", port, "-U", "postgres", "--if-exists", database
  ]]);
  assert.deepEqual(calls.at(-1).slice(0, 2), ["pg_ctl", [
    "-D", data, "-m", "immediate", "-w", "stop"
  ]]);
  assert.deepEqual(filesystem.at(-1), ["remove", root, { recursive: true, force: true }]);
  for (const [, , options] of calls) {
    assert.equal(Object.keys(options.env).some(key => key.startsWith("PG")), false);
    for (const key of [
      "SOUND_SEEKERS_LOCAL_POSTGRES_ADMIN_URL", "SOUND_SEEKERS_TEST_DATABASE_URL", "DATABASE_URL"
    ]) assert.equal(Object.hasOwn(options.env, key), false, key);
  }
  const commandText = JSON.stringify(calls);
  assert.equal(commandText.includes("remote.example"), false);
  assert.equal(commandText.includes("do-not-print"), false);
  assert.deepEqual(output, ["PASS: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST"]);
  assert.deepEqual(errors, []);
});

test("missing PostgreSQL binaries block before any mutation and map only to exit two", () => {
  for (const missing of ["initdb", "pg_ctl", "psql", "createdb", "dropdb"]) {
    const calls = [];
    let mutated = false;
    const output = [];
    const result = runSoundSeekersContentDeckSqlSelftest({
      args: [], env: { PATH: "/fixture/bin" }, randomBytes: () => { mutated = true; },
      tmpdir: () => "/fixture", mkdtemp: () => { mutated = true; },
      mkdir: () => { mutated = true; }, remove: () => { mutated = true; },
      runCommand: (binary, args) => {
        calls.push([binary, [...args]]);
        return binary === missing
          ? { status: null, stdout: "", stderr: "", error: Object.assign(new Error("missing"), { code: "ENOENT" }) }
          : { status: 0, stdout: "", stderr: "" };
      },
      stdout: message => output.push(message), stderr: () => {}
    });
    assert.deepEqual(result, { status: "blocked", reason: "SQL_DIRECT_GATE_UNAVAILABLE" });
    assert.deepEqual(output, ["BLOCKED: SQL_DIRECT_GATE_UNAVAILABLE"]);
    assert.equal(mutated, false, missing);
    assert.equal(calls.every(([, args]) => args[0] === "--version"), true, missing);
  }
  assert.equal(soundSeekersContentDeckSqlSelftestMain({
    argv: [], env: {}, run: () => ({ status: "passed" }), stdout: () => {}, stderr: () => {}
  }), 0);
  assert.equal(soundSeekersContentDeckSqlSelftestMain({
    argv: [], env: {}, run: () => ({ status: "blocked", reason: "SQL_DIRECT_GATE_UNAVAILABLE" }),
    stdout: () => {}, stderr: () => {}
  }), 2);
  const hardErrors = [];
  assert.equal(soundSeekersContentDeckSqlSelftestMain({
    argv: [], env: {}, run: () => { throw new Error("hard secret /tmp/path"); },
    stdout: () => {}, stderr: message => hardErrors.push(message)
  }), 1);
  assert.deepEqual(hardErrors, ["ERROR: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST_FAILED"]);
  const invalidErrors = [];
  assert.equal(soundSeekersContentDeckSqlSelftestMain({
    argv: ["--database", "prod"], env: {}, run: () => { throw new Error("must not run"); },
    stdout: () => {}, stderr: message => invalidErrors.push(message)
  }), 1);
  assert.deepEqual(invalidErrors, ["ERROR: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST_FAILED"]);
});

test("every non-ENOENT binary probe failure is hard and still precedes mutation", () => {
  for (const binaryUnderTest of ["initdb", "pg_ctl", "psql", "createdb", "dropdb"]) {
    for (const mode of ["throw", "null-status", "nonzero"]) {
      let mutated = false;
      const dependencies = {
        args: [], env: { PATH: "/fixture/bin", PGSSLMODE: "require" },
        randomBytes: () => { mutated = true; }, tmpdir: () => "/fixture",
        mkdtemp: () => { mutated = true; }, mkdir: () => { mutated = true; },
        remove: () => { mutated = true; }, stdout: () => {}, stderr: () => {},
        runCommand: (binary, args) => {
          assert.deepEqual(args, ["--version"]);
          if (binary !== binaryUnderTest) return { status: 0, stdout: "", stderr: "" };
          if (mode === "throw") throw Object.assign(new Error("probe secret"), { code: "EACCES" });
          if (mode === "null-status") {
            return { status: null, stdout: "", stderr: "", error: Object.assign(new Error("probe secret"), { code: "EACCES" }) };
          }
          return { status: 1, stdout: "secret", stderr: "secret" };
        }
      };
      assert.throws(() => runSoundSeekersContentDeckSqlSelftest(dependencies), /probe|preflight|PostgreSQL binary/i,
        `${binaryUnderTest}:${mode}`);
      assert.equal(mutated, false, `${binaryUnderTest}:${mode}`);
    }
  }
});

test("the conservative Darwin socket-path ceiling fails before cluster initialization", () => {
  const calls = [];
  const longTmpdir = `/fixture/${"x".repeat(90)}`;
  const prefix = join(longTmpdir, "lp-ss-");
  const root = `${prefix}AbC123`;
  let removedPath;
  assert.throws(() => runSoundSeekersContentDeckSqlSelftest({
    args: [], env: { PATH: "/fixture/bin" },
    runCommand: (binary, args) => {
      calls.push([binary, [...args]]);
      return { status: 0, stdout: "", stderr: "" };
    },
    randomBytes: size => size === 2
      ? Buffer.from([0x12, 0x34])
      : Buffer.from("00112233445566778899aabb", "hex"),
    tmpdir: () => longTmpdir,
    mkdtemp: actualPrefix => {
      assert.equal(actualPrefix, prefix);
      return root;
    },
    mkdir: () => {},
    remove: path => { removedPath = path; },
    stdout: () => {}, stderr: () => {}
  }), /socket.*path.*103|sun_path/i);
  assert.deepEqual(calls.map(([binary, args]) => [binary, args]), [
    ["initdb", ["--version"]], ["pg_ctl", ["--version"]], ["psql", ["--version"]],
    ["createdb", ["--version"]], ["dropdb", ["--version"]]
  ]);
  assert.equal(removedPath, root);
  assert.match(removedPath, /\/lp-ss-[A-Za-z0-9_-]+$/u);
});

test("every command and filesystem failure runs all applicable exact-root cleanup", () => {
  for (const primaryStage of [
    "mkdtemp", "mkdir", "initdb", "start", "createdb", ...SOUND_SEEKERS_CONTENT_DECK_SQL_FILES
  ]) {
    const failureModes = ["mkdtemp", "mkdir"].includes(primaryStage)
      ? ["throw"]
      : ["throw", "nonzero", "null-status"];
    for (const failureMode of failureModes) {
      const harness = createEphemeralPostgresFailureHarness({ primaryStage, failureMode });
      assert.throws(() => runSoundSeekersContentDeckSqlSelftest(harness.dependencies),
        new RegExp(primaryStage === "mkdtemp" ? "mkdtemp" : primaryStage.split("/").at(-1), "u"));
      assert.equal(harness.output.includes("PASS: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST"), false);
      assert.equal(harness.redactedOutput.includes(harness.secret), false);
      if (primaryStage === "mkdtemp") {
        assert.deepEqual(harness.cleanupStages, []);
        assert.equal(harness.removedPath, undefined);
      } else if (["mkdir", "initdb"].includes(primaryStage)) {
        assert.deepEqual(harness.cleanupStages, ["remove"]);
      } else if (primaryStage === "start") {
        assert.deepEqual(harness.cleanupStages, ["stop", "remove"]);
      } else {
        assert.deepEqual(harness.cleanupStages, ["terminate", "drop", "stop", "remove"]);
      }
      if (primaryStage !== "mkdtemp") {
        assert.equal(harness.removedPath, harness.root);
        assert.match(harness.removedPath, /\/lp-ss-[A-Za-z0-9_-]+$/u);
      }
    }
  }
});

test("cleanup attempts terminate, drop, stop, and remove and preserves a primary failure", () => {
  const primary = createEphemeralPostgresFailureHarness({
    primaryStage: "supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql",
    failureMode: "nonzero",
    cleanupFailures: new Set(["terminate", "drop", "stop", "remove"])
  });
  let error;
  assert.throws(() => runSoundSeekersContentDeckSqlSelftest(primary.dependencies), candidate => {
    error = candidate;
    return true;
  });
  assert.equal(error.stage, "selftest");
  assert.deepEqual(primary.cleanupStages, ["terminate", "drop", "stop", "remove"]);
  assert.deepEqual(error.cleanupStages, ["terminate", "drop", "stop", "remove"]);
  assert.equal(String(error).includes(primary.secret), false);

  for (const cleanupStage of ["terminate", "drop", "stop", "remove"]) {
    const cleanupOnly = createEphemeralPostgresFailureHarness({
      cleanupFailures: new Set([cleanupStage])
    });
    let cleanupError;
    assert.throws(() => runSoundSeekersContentDeckSqlSelftest(cleanupOnly.dependencies), candidate => {
      cleanupError = candidate;
      return true;
    });
    assert.equal(cleanupError.stage, "cleanup");
    assert.deepEqual(cleanupOnly.cleanupStages, ["terminate", "drop", "stop", "remove"]);
    assert.equal(cleanupOnly.output.includes("PASS: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST"), false);
  }
});
```

- [ ] **Step 2: Run the deck/state tests and confirm the red state**

Run:

```bash
node --test tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentTransactions.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/runSoundSeekersContentDeckSqlSelftest.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersEvidenceEligibility.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js
```

Expected: FAIL because the exact schedule, 85 non-heart records/bindings, five owner-bound insertion placements, durable wrong→fresh-correct placement/composite attempts, answer-safe immutable attempt receipts, truthful event retention, eight private three-choice boss decisions, narrative-token-bound reciprocal uses, truthful non-assessed morphology application, structural-state/canonical-rehydration boundary, canonical full served/catalog resolver source, one-visit/two-use s6 behavior without retained served inputs, forty coexisting composite transactions, boss-context tamper rejection, 1,000-seed route/ranking proof, canonical five-category coverage exclusion, Espree-derived all-module import boundary, absorbing conflict ledgers, pre-fingerprint normalization, non-heart activity omission, two extra categories, exact whole-state JS/SQL merge contracts, minimal local bootstrap, and the self-contained socket-only PostgreSQL gate do not exist. The already-present child `activityType` allowlist is not an expected red.

- [ ] **Step 3: Implement the records, deterministic scheduler, and explicit state merge**

Author exactly 60 records using the table above rather than deriving legacy positions. Membership still equals the canonical legacy set. `a` is the sole deliberately earlier word; every other word stays at or after its legacy declaration. A word becomes eligible only at its authored stop, and its first serve uses its exact introduction slot.

Author and validate the exact 85 non-heart records and their 85 owner bindings. Story records bijectively cover Task 1 IDs/slots as `story:scene-s1` through `story:scene-s40` and bind the named `sN-story`/Story Power owners. Transfers are `transfer:s1` through `transfer:s40`, bind each exact slot and Task 1 `sN-transfer` owner, and copy that action's complete instruction/power/action/domain and connected-text-or-boss evidence identity. Author the literal eight-row boss table above inside those exact boss records: recursively freeze all 24 equal-shape controlled-meaning options and eight private keys, require exactly three unique opaque tokens and one member key per boss, require `bossDecision:null` for all 32 other transfers, and reject a word token/singleton/fabricated challenge. Alternatives bind the four structural stops, exact target lists, authored same-family comparisons, and named Contrast Sort placement owners. The sole morphology item is the explicitly non-assessed `suffix_s` application in `cats` with the named `s38-morphology`/Word Forge placement owner, `targetId:null`, and no evidence key. Reject missing/duplicate slots, records, owners, action-use IDs, content instances, placement IDs, or consumers; early introduction; spelling-inferred alternatives/morphology; a morphology evidence target; and any transfer domain/identity inconsistent with its authored Task 1 action.

Author the five `CONTENT_DECK_PLACEMENTS` literally from the table above. Validate every `afterPhaseId`, order, owner binding, and unchanged Task 1 tuple. Begin/resume only the checkpoint above; `materializeContentPlacementChallenge()` joins its registered placement, rehydrated instance/record, exact current target ordinal, attempt ordinal, and derived correction support. Alternative keys stay private and only one current child action exists. `commitContentPlacementResponse()` records that action immediately, retains earlier correct targets, and moves only to retry/model/next-target/completed as canonically derived. Prove pause/reload after every action, one/three misses, one model-only step, supported fresh success, per-target event IDs, exact receipt-chain final use, identical retry, and changed s38/private-key/correction/audio/time rejection. The morphology application remains one non-recording challenge with zero evidence, one exposure use, and one receipt; it never adds an evidence domain/target.

Classify parts from the canonical pronunciation record, not from whether the child has encountered that correspondence yet: a canonical unit whose role is exactly `irregular` belongs in `heartParts`; every other canonical unit belongs in `regularParts`. Unknown does not mean irregular. If linguistic review requires changing a unit's role, change the generator's authoritative pronunciation source and regenerate first; do not override it in the high-frequency-word deck.

After validating an exact owner binding, the scheduler applies this order within its category/slot:

1. Eligible, never-served introductions assigned to the current slot.
2. Lowest aggregate valid-use count across the complete sorted activity set bound to that content instance.
3. Lowest use count for that candidate's worst-served required activity.
4. Oldest `activityLastServed` for that worst activity, treating never served as older than every numbered step.
5. `null` only when no eligible content exists.

For each candidate, the worst activity is the required activity with the smallest valid-use count; ties choose the oldest last-served step, then lexical activity ID. After the rank tuple above, ties use a stable seeded order over canonical record ID, slot, journey step, category, seed, and the complete sorted activity set. Input array order may not change the result. An activity is never a scheduler choice. Across broad seeds, the 80 owner visits cover all 60 words and Task 1's four activities; each non-heart structural slot resolves its one exact record. Replaying the route at a later `journeyStep` creates a new visit for that pass; two different visits may never claim the same content instance at the same step.

The 1,000-seed test is literal, not a test title over one route: seeds `0` through `999` each start from a fresh five-category deck, run all 80 Task 1 owner opportunities, and assert exact first-introduction stop/slot identity, 80 structurally valid visits, 60 distinct first-served records, all four fixed activities, and a canonical heart part for every mapping selection. Before every serve it ranks the identical canonical eligible set in forward and reverse input order under that seed and requires identical record-ID order. No shared state, cached rank, or result from one seed may enter the next.

Keep the thirteen-module import test as an Espree AST contract. Espree `11.2.0` is already installed through the current lockfile, so Task 2 changes no package file. Parse every named Task 2 runtime/pure module with `ecmaVersion:"latest"` and `sourceType:"module"`; recursively walk `espree.VisitorKeys`; resolve every `ImportDeclaration`, `ExportNamedDeclaration`, and `ExportAllDeclaration` through an explicit relative `.js` path and `realpathSync`; and compare the derived edge set with the literal 32-edge allowlist above, including the direct `contentDeckTransactions -> questCorrection` and `contentDeckTransactions -> contentCoverage` authority edges while forbidding `contentCoverage -> questCorrection`. Reject `ImportExpression`, `require()`, a bare/aliased specifier, `index.js`/public-barrel indirection, a missing target, a symlink escape, a local target outside the named Task 2/external-authority map, any added or missing edge, and any directed cycle among the thirteen Task 2 modules. The mutation cases above must fail for dynamic, CommonJS, alias, barrel, unknown-local, forbidden-edge, and allowed-but-cyclic source variants; a hand-authored graph not derived from parsed current source cannot satisfy the test.

This task's scheduler/transaction tests prove authored catalog coverage and reducer behavior, not production reachability. The later runtime plan must drive the actual mission planner and reducers through all 40 stops, visibly enter and complete all 80 `content_opportunity` subphases plus the five exact content placements, record all 80 unique heart visits and their practice decisions, cover all 60 words and four activity types, exercise all alternative targets and the non-assessed morphology application, and prove every surrounding Task 1 primary/secondary challenge retains its original power/decision tuple.

Create the full served object only after registering its exact visit. Project heart decisions through the existing resolver rather than duplicating its validation:

```js
const resolverInputs = projectBoundContentResolverInputs(
  rehydrateServedContentInstance(state.contentDecks, { category: "heartWords", visitId })
);
const challenge = {
  ...resolveBoundContentDecision(action, resolverInputs),
  attemptId
};
```

On resume, discard the old served object and any earlier resolver-input object, rehydrate from `state.contentDecks` plus the registered binding plus canonical catalog, and fail closed on any mismatch. `recordContentDeckUse()` repeats this verification against its complete `contentDecks` argument; passing a pre-checkpoint object is never sufficient authority. For story/transfer, begin by serving both owners, checkpoint only the exact pending descriptor after the story bridge, and rehydrate both visits plus the persisted attempt and complete contiguous `validAttemptReceipts(state)` history on resume. `materializeStoryTransferChallenge()` is the sole canonical challenge producer for all 40 stops; Task 3 may verify and return its object-identical non-boss result, while `materializeBossTransferChallenge()` is only the eight-boss type guard/delegate. Canonicalize and synchronously SHA-256 the complete private attempt input before every response mutation; append exactly one validated truthful event and one receipt for that attempt. A wrong response advances only the attempt ordinal/ID, returns `{nextState,event,outcome:"retry"|"model_required",completed:false,correction}`, and creates no uses. The third wrong leaves the fresh attempt in `model_pending`; `completeStoryTransferCorrectionModel()` writes no event/use/receipt and changes only that stage before the same attempt may be answered with derived support 3/revealed true. A correct response builds both reciprocal uses with the checkpoint token, correct event, and complete ordered receipt chain in local temporaries, validates the whole candidate state, clears the checkpoint, and returns `{nextState,event,outcome:"completed",completed:true,correction:null}` once. Never expose or persist an intermediate one-use state, raw fingerprint input, correction/support projection, boss answer key, or retained full challenge.

Persist only immutable allowlisted visits and uses; derive summaries at read time:

```js
export function deriveContentDeckRecordStats(state, category, recordId) {
  const uses = validContentDeckUses(state, category)
    .filter(use => use.recordId === recordId);
  const steps = uses.map(use => use.journeyStep).filter(step => Number.isInteger(step) && step > 0);
  return {
    firstServedStep: steps.length ? Math.min(...steps) : null,
    lastServedStep: steps.length ? Math.max(...steps) : null,
    useCount: uses.length,
    activityCounts: countHeartActivities(uses),
    activityLastServed: latestStepByHeartActivity(uses)
  };
}
```

Normalize before fingerprinting and use one absorbing union rule in both languages:

```js
function unionImmutableEntry(entryId, left, right, { idKey, conflictKind }) {
  const marker = () => Object.freeze({ kind: conflictKind, [idKey]: entryId });
  if (left && left[idKey] !== entryId) left = marker();
  if (right && right[idKey] !== entryId) right = marker();
  if (!left) return right;
  if (!right) return left;
  if (left.kind === conflictKind || right.kind === conflictKind) {
    return marker();
  }
  return immutableFingerprint(left) === immutableFingerprint(right)
    ? left
    : marker();
}
```

Call this only with normalized exact visit/use/receipt records and the enclosing ledger key as `entryId`; the ledger key, never merge direction, supplies a conflict marker's immutable ID. `normalizeContentDeckVisit()` strips `ownerActivityType` before adding back one valid trimmed heart activity; non-heart visits omit it. `normalizeContentDeckUse()` does the same for heart-only `activityType`, strips composite fields from ordinary uses, adds the exact composite fields only to structurally valid `stories`/`transfer` uses, and normalizes every non-heart `attemptReceiptIds` array to unique canonical order; `narrativeChoiceToken` is only exact `null` or a trimmed nonempty string. A malformed heart activity, missing/invalid receipt dependency, or incomplete composite identity with a usable immutable ID normalizes to that ID's conflict marker. `validContentDeckVisits(contentDecks,category)` groups structurally valid records by `(category,contentInstanceId,journeyStep)` and excludes every member of a multi-ID group.

`validAttemptReceipts(state)` returns one frozen deterministic structural array of normalized receipts ordered by operation, subject, decision ordinal, attempt ordinal, and attempt ID. It accepts only receipts whose event/use references resolve exactly in the complete normalized state, whose deterministic attempt IDs and ordinals agree, whose receipt sequence is contiguous, whose wrong-attempt correction ID is exactly `content-correction:${attemptId}`, and whose event correctness plus support/reveal fields follow the exact `0/1/2/3` and `false/false/false/true` sequence implied by prior wrong events and model-stage consumption. It does not reconstruct or claim the authored intended token. Transaction begin/resume/materialize/model/commit separately rehydrate the canonical challenge and replay the real `nextCorrection()` with actual selected/intended tokens before any child presentation or mutation. No event or use may be owned by two receipts. A placement miss/intermediate receipt has one event and zero uses; the final alternative receipt owns its final use; s38 owns zero events and one use; a story miss has one event and zero uses; and its completed receipt owns one correct event plus the exact reciprocal pair. Dangling raw receipts remain merge-repairable but are excluded; any referenced absorbing evidence/use/receipt conflict invalidates the receipt permanently.

`validContentDeckUses(state,category)` requires the complete normalized v2 state. It first requires a structurally valid parent visit and exact equality for category, visit/content-instance/owner/slot/record/journey identities. A shared heart use requires the owner entry at `visitId + ":" + parentVisit.ownerActionUseId`. Every non-heart use must name its complete chain from `validAttemptReceipts(state)`; only the final receipt may name the use, and both composite halves must carry the identical chain. A story/transfer use additionally requires its reciprocal pair with identical transaction/evidence/narrative identities and matching stop/journey identity; from the transfer parent visit, `wordId:null` requires both tokens null and non-null `wordId` requires both tokens nonempty. The projection never consults object iteration, arrival, or timestamp order. A later branch union can restore a dangling receipt, shared-owner dependency, or missing reciprocal half, but never an absorbing conflict. `rehydrateServedContentInstance()`, placement/story transactions, and `coverageStatus(state)` separately require exact binding/catalog and boss/non-boss token identity, so a structurally valid but unauthorised complete receipt/evidence/use chain remains raw merge data and never reaches a reducer or canonical coverage.

`completeCanonicalContentCoverageState()` is a test-only fixture built exclusively through the public serve/use, placement, and story-transfer reducers: it records the 80 heart owner visits and all 81 heart uses including the shared `s6-primary` use, 40 paired story/transfer completions, four alternative placement completions, one morphology exposure, every truthful evidence event, and every response receipt. `structurallyValidUnauthorisedContentDeckFixture()` is a test-only complete raw-state fixture returning exactly `{contentDecks,evidence,attemptReceipts,entryIds,recordIds}`. It authors one unique noncatalog visit/use in each category; its alternative has a structurally valid one-event completed receipt, morphology has a zero-event completed receipt, and story/transfer share one correct event plus one completed receipt that names the reciprocal pair. Every receipt fingerprint is syntactically valid and every event/use relationship passes only the state-owned structural projection. The heart subtype is valid and needs no receipt. The fixture must not reuse a canonical slot, binding, record, content instance, owner, action-use ID, visit ID, use ID, event ID, receipt ID, or subject ID. Its entries remain byte-equivalent in the raw union, contribute one whole-state-valid use to each invented record's derived statistics, fail scheduler rehydration, and contribute zero canonical coverage. A raw unauthorised use without its valid receipt/evidence chain contributes zero statistics rather than bypassing referential validity.

Do not add `activityType` to the child-safe allowlist: it is already present. Make the red contract target the missing behavior instead: one imported type is required for `heart_word_mapping`, a missing/invalid heart type and every type on another domain are rejected, activity is normalized before evidence dedupe, and `createLiteracyDecision()` omits the property entirely from non-heart events. Preserve the existing canonical nulls for irrelevant `word`, `position`, `connectedTextId`, and `bossTransferId`. Never fan heart evidence into GPC evidence.

Add `morphology` and `transfer` while older v2 saves may omit them. Every category normalizes to `{visits:{}, uses:{}}`, and absent `attemptReceipts` normalizes to `{}`. `contentDeckState.js` is the sole structural deck schema used by `stateV2`; remove the old deck `mergeRecords` path. `stateV2` normalizes/unions exact receipt records by immutable ID with the same absorbing-marker algebra as JS deck entries. Checkpoint normalization allowlists only the two exact descriptors above. A placement descriptor must have exact `stage:"response_pending"|"model_pending"`, nonnegative `targetOrdinal`/`attemptOrdinal`, and deterministic `content-placement-attempt:${visitId}:${placementId}:${targetOrdinal}:${attemptOrdinal}`; a story descriptor must have that exact stage, nonnegative `attemptOrdinal`, and deterministic `story-transfer-attempt:${transactionId}:${attemptOrdinal}`. Structural normalization accepts either literal stage when the descriptor's exact identity/ordinal/visit shape is valid; it does not inspect evidence or receipts. Neither descriptor may contain correction, support, reveal, miss, model, answer, response, event, or use data. The placement descriptor must name one structurally valid alternatives/morphology visit with matching category/stop/journey identity; the story descriptor must name both structurally valid story/transfer visits with matching stop/journey identity and structural narrative-token shape. Transaction-owned resume/model/commit then rehydrate bindings/catalogs/placements and replay `validAttemptReceipts(state)` plus canonical challenges through `nextCorrection()`. They require attempt/history/target consistency; after three valid misses, `model_pending` is the owed-model state and `response_pending` is the trusted durable consumed-model marker. They reject zero-history or otherwise impossible ordinal-3 stages, but do not overclaim that a manually flipped stage with an otherwise exact valid three-miss chain is distinguishable from reducer output. Both descriptors remain local resume state under the existing local-checkpoint merge direction. Checkpoint/resume retains the registered s6 visit and completed `encoding` owner use before the later shared `heart_part_mapping` use, but never serializes a full served object, resolver input, answer-token map, boss decision, response, audio result, correction/support projection, or raw receipt input. Every placement response is already durable before the next target appears. A wrong placement/composite retains its event/receipt and only the fresh descriptor with zero final uses; a third miss stops at `model_pending`; a transfer pending before any response has zero uses/events/receipts. A later route pass uses fresh journey-step IDs; identical recorded attempts are receipt-validated no-ops and divergent reuse fails closed, while statistics require whole-state-valid uses and coverage additionally requires canonical rehydration.

Add the new forward migration here, never by changing `20260901120000`. `lp_quest_normalize_v2_activity_type(domain text, value text) returns text` returns a trimmed imported heart subtype only for `heart_word_mapping` and otherwise returns `null`; evidence normalization removes the JSON property first and adds it back only when this helper returns a value. Reissue evidence union so both branches normalize before payload comparison/grouping. Define the exact deck functions `lp_quest_normalize_v2_deck_visit(category text, entry_id text, value jsonb) returns jsonb`, `lp_quest_normalize_v2_deck_use(category text, entry_id text, value jsonb) returns jsonb`, `lp_quest_union_v2_deck_visits(category text, left_visits jsonb, right_visits jsonb) returns jsonb`, `lp_quest_union_v2_deck_uses(category text, left_uses jsonb, right_uses jsonb) returns jsonb`, `lp_quest_merge_v2_deck(category text, left_deck jsonb, right_deck jsonb) returns jsonb`, `lp_quest_merge_v2_content_decks(left jsonb, right jsonb) returns jsonb`, `lp_quest_normalize_v2_attempt_receipt(entry_id text,value jsonb) returns jsonb`, `lp_quest_union_v2_attempt_receipts(left_receipts jsonb,right_receipts jsonb) returns jsonb`, `lp_quest_valid_v2_attempt_receipts(evidence jsonb,content_decks jsonb,attempt_receipts jsonb) returns jsonb`, and `lp_quest_valid_v2_content_decks(content_decks jsonb,attempt_receipts jsonb,evidence jsonb) returns jsonb`.

The deck union helpers enumerate the union of ledger keys and pass the outer category plus each key into the corresponding normalizer before applying the absorbing immutable-entry rule. The receipt union does the same with the enclosing attempt ID, exact receipt schema, lowercase SHA, decision/attempt ordinals, unique ordered correction/event/use arrays, and `attempt_receipt_conflict`. `lp_quest_merge_v2_deck` returns the raw normalized union for one supplied exact category; `lp_quest_merge_v2_content_decks` returns exactly the five categories, while the reissued overall learning merge separately writes `attemptReceipts := lp_quest_union_v2_attempt_receipts(...)`. `lp_quest_valid_v2_attempt_receipts` is the non-persisted SQL parity projection: it excludes dangling or conflicted references, duplicate ownership, noncontiguous ordinals, malformed event IDs, support/reveal/correctness that does not match the canonical ladder, incomplete placement chains, and any completed story receipt without exactly one correct event plus its reciprocal use pair. `lp_quest_valid_v2_content_decks` then excludes duplicate claims, orphan/shared-before-owner uses, non-heart uses without their complete valid receipt chains, unpaired/non-reciprocal story/transfer uses, narrative-token disagreement, missing/blank boss-shaped tokens, and non-null non-boss-shaped tokens. Neither validity function deletes raw merged entries, so a later union may restore a genuinely missing dependency; an absorbing conflict remains invalid.

Visit normalization handles `ownerActivityType` before JSONB equality/fingerprinting exactly as JS does; use normalization handles `activityType`, ordered `attemptReceiptIds`, and all exact composite fields, including exact-null-or-trimmed-nonempty `narrativeChoiceToken`, before fingerprinting. Fields illegal for the category are omitted and an incomplete identity becomes a conflict marker. Deck and receipt unions are associative, commutative, idempotent, and never merge or persist validity projections or computed statistics. Preserve every unrelated foundation branch, wrapper, pre-existing signature, revoke, and grant exactly. The existing checkpoint winner rule is preserved; literal structurally shaped `response_pending` and `model_pending` placement/story descriptors normalize identically in client and SQL without converting either into achievement, correction, or evidence. Transaction-owned canonical resume rejects impossible history/stage combinations and treats only reducer/runtime evidence—not the stage alone—as proof that the child actually saw the model presentation.

The SQL self-test runs both directions plus A/B/C regrouping across all five deck ledgers, evidence, and `attemptReceipts`. Include all four heart activities; one s6 visit with ordered `encoding` owner then `heart_part_mapping` shared uses; rejection of a shared-before-owner use while preserving its raw entry; and a later-step replay with fresh IDs. Exercise a multi-target alternative as separate response receipts: first miss, correct retry, correct intermediate target, reload-equivalent state, and final correct target whose one use names the complete ordered chain. Exercise the full shared correction ladder for both placement and story: attempt 0 support 0, misses leading to attempts 1/2 at support 1/2, third miss leading to the fresh attempt 3 `model_pending`, model consumption changing only the stage, and the same attempt 3 response at support 3/revealed true. Include one non-boss reciprocal pair with null narrative tokens and connected-text evidence, one boss pair with the same nonempty narrative token and novel-decoding evidence, and s38's zero-event completed receipt/use.

Reject while retaining raw data: either unpaired half, a missing narrative field, boss null/blank token, non-boss non-null token, either token mismatch, dangling event/use/receipt dependencies, duplicate receipt ownership, gaps or duplicate ordinals, support/reveal mismatch, an incorrect event after a decision is closed, and a completed receipt that does not own exactly its permitted use set. Prove that an exact missing event/use/reciprocal dependency later restores validity, but a same-ID divergent receipt, evidence event, visit, or use becomes an absorbing conflict in both merge directions and A/B/C groupings; a conflicted receipt must invalidate its dependent use and reduce projected coverage even while the raw use remains. Also cover malformed receipt IDs/hash/operation/decision/attempt/correction/event/use arrays; unknown fields; whitespace activity/token normalization; invalid heart owner/use activities; illegal/incomplete composite fields; a non-heart `ownerActivityType`; absent older categories/receipt ledger; and non-heart evidence whose `activityType` is omitted while irrelevant word/position/text/boss identities retain canonical nulls. Call both exact validity signatures directly. Assert byte-equivalent raw conflict markers, byte-equivalent valid-receipt and valid-use projections, reciprocal valid uses with exact narrative tokens, truthful per-action events, and client/SQL-equivalent stats, while assignment/reset/checkpoint/settings/journal/reward behavior and every security boundary remain unchanged. `progressMerge.test.js` reads migration and self-test separately, requires exact helpers/normalization/signatures/revokes/grants plus executable model-stage/receipt/dependency/conflict fixtures, and cannot substitute source inspection for the direct private-cluster gate.

Implement the direct gate only in `tools/runSoundSeekersContentDeckSqlSelftest.mjs` with Node built-ins and argument-array subprocesses; there is no migration discovery and no URL parser. Freeze the six literal files above. Delete every inherited `PG*` key plus the three named URL variables once and pass that sanitized environment to every probe and command. Probe all five binaries before calling any random/filesystem dependency; only probe `ENOENT` is blocked, while throw/null/nonzero are hard failures. Use separate random draws for port and database name, derive the `mkdtemp` prefix only as `join(tmpdir(),"lp-ss-")`, and treat only the exact returned `lp-ss-*` root plus its `d`/`s` descendants as task-owned. Enforce the 103-byte UTF-8 longest-lock-path ceiling after root creation but before `initdb`, then execute every SQL file with the exact socket-bound `psql -X --set=ON_ERROR_STOP=1` argument array. Treat a thrown error, `status:null`, or any nonzero status as failure and redact it at construction time. Enter owned-root `try/finally` immediately after `mkdtemp`; track `startAttempted` and `createAttempted` so partial failures receive the applicable termination/drop/stop/remove attempts. Accumulate cleanup errors while continuing all cleanup, attach only redacted cleanup stage names to a primary error, and throw a cleanup-only error when there was no primary failure. Validate the deletion root/prefix/descendants before the one recursive remove. `createEphemeralPostgresFailureHarness()` is a test-only injected fixture with deterministic short root/socket/port/database identities; it records `calls`, `cleanupStages`, `removedPath`, `output`, `redactedOutput`, and a secret sentinel, and can independently throw or return status `1`/`null` at every probe/command stage plus throw at `mkdtemp`, `mkdir`, terminate, drop, stop, or remove. For an `mkdtemp` failure `removedPath` remains `undefined`; every later owned-root failure records the exact removed root. The unit tests above must use it to prove every failure and combined failure contract, not merely inspect runner source.

- [ ] **Step 4: Run 1,000 seeded journeys, activity separation, merge, and resume fixtures**

Run:

```bash
node --test tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentTransactions.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/runSoundSeekersContentDeckSqlSelftest.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersEvidenceEligibility.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js
```

Then run the zero-input direct gate. It initializes its own socket-only PostgreSQL cluster, creates its roles/database, applies only the literal bootstrap/prerequisite chain, runs the Task 2 migration/self-test, and removes the entire exact temp root:

```bash
node tools/runSoundSeekersContentDeckSqlSelftest.mjs
```

Expected: exit `0` and exactly `PASS: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST` only after database termination/drop, cluster stop, and exact-root removal. Missing `initdb`, `pg_ctl`, `psql`, `createdb`, or `dropdb` prints exactly `BLOCKED: SQL_DIRECT_GATE_UNAVAILABLE`, mutates nothing, and exits `2`; report that separate gate as blocked. Arguments and every initialization/start/create/migration/self-test/status/cleanup failure print only the redacted hard-error line and exit `1`. Source-reading assertions may remain green but do not satisfy or waive direct SQL execution parity.

Expected for the JS suite: PASS for literal seeds `0..999`, each from fresh state, with all 60 introduced by stop 32 at no more than two per stop, no regular-only record introduced into a mapping slot, and forward/reversed candidate arrays producing identical rank order at every slot; exact non-heart record/binding counts `40/40/4/1`; exact record IDs `story:scene-s1`…`story:scene-s40` and `transfer:s1`…`transfer:s40`; and five stop-qualified placements after teach and before unchanged Task 1 tuples. Every alternative target commits as one durable action: wrong events remain with zero uses, correct intermediate targets survive reload, the final correct target creates one use with the complete receipt chain, third misses stop at model-only state, supported success retains level 3/revealed truth, exact retries are idempotent, and changed challenge/private key/correction/audio/time input fails by independently checked SHA. s38 produces one exposure use, zero evidence, one answer-safe receipt, and rejects changed retry.

Also require 80 structural heart visits and 81 valid heart uses including shared `s6-primary`; exact s6 resolver/evidence resume with no retained full inputs; exactly eight frozen three-choice private boss decisions and no fabricated/singleton challenge; and all 40 first-pass composite transactions accumulated in one state with distinct visits/uses and exact persisted attempt identities/receipts. Representative non-boss and boss paths cover wrong→fresh retry, three misses→model consumption→same fresh supported attempt→correct, exactly 32 final connected-text and 8 final novel-decoding outcomes plus truthful misses, all eight nonempty boss narrative tokens and 32 null tokens copied identically to reciprocal uses, token/boss/private-key tamper rejection, zero bridge evidence, and later-step replay. Require deterministic structural `validAttemptReceipts(state)`, absorbing associative visit/use/evidence/receipt conflicts in JS and SQL, missing-evidence repair, evidence/use/receipt-conflict propagation that invalidates every dependent use and product coverage, exact coverage totals `60/40/4/1/40`, the Espree-derived 32-edge graph, canonical null evidence identities with no non-heart `activityType`, all five branches and optional older-save receipt handling, identical continuation after every checkpoint stage, separate migration/self-test assertions, exact-root SQL-runner cleanup including long socket paths, direct local SQL execution, and unchanged foundation SQL boundaries. Do not call this production-reachable until the later real mission simulation passes.

- [ ] **Step 5: Commit the complete high-frequency-word journey**

```bash
git add -A -- src/features/soundSeekers/content/heartWordRecords.js src/features/soundSeekers/content/heartWords.js src/features/soundSeekers/content/contentDeckRecords.js src/features/soundSeekers/content/contentDeckBindings.js src/features/soundSeekers/content/contentDeckCatalogs.js src/features/soundSeekers/engine/contentDeckState.js src/features/soundSeekers/engine/contentDeckScheduler.js src/features/soundSeekers/engine/contentDeckTransactions.js src/features/soundSeekers/engine/contentCoverage.js src/features/soundSeekers/engine/evidence.js src/features/soundSeekers/engine/evidenceEligibility.js src/features/soundSeekers/engine/stateV2.js supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql tools/runSoundSeekersContentDeckSqlSelftest.mjs tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentTransactions.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/runSoundSeekersContentDeckSqlSelftest.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersEvidenceEligibility.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js
node --input-type=module - <<'NODE'
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const expected = [
  "src/features/soundSeekers/content/heartWordRecords.js",
  "src/features/soundSeekers/content/heartWords.js",
  "src/features/soundSeekers/content/contentDeckRecords.js",
  "src/features/soundSeekers/content/contentDeckBindings.js",
  "src/features/soundSeekers/content/contentDeckCatalogs.js",
  "src/features/soundSeekers/engine/contentDeckState.js",
  "src/features/soundSeekers/engine/contentDeckScheduler.js",
  "src/features/soundSeekers/engine/contentDeckTransactions.js",
  "src/features/soundSeekers/engine/contentCoverage.js",
  "src/features/soundSeekers/engine/evidence.js",
  "src/features/soundSeekers/engine/evidenceEligibility.js",
  "src/features/soundSeekers/engine/stateV2.js",
  "supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql",
  "supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql",
  "supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql",
  "tools/runSoundSeekersContentDeckSqlSelftest.mjs",
  "tests/unit/soundSeekersHeartWords.test.js",
  "tests/unit/soundSeekersContentDecks.test.js",
  "tests/unit/soundSeekersContentTransactions.test.js",
  "tests/unit/soundSeekersContentCoverage.test.js",
  "tests/unit/runSoundSeekersContentDeckSqlSelftest.test.js",
  "tests/unit/soundSeekersEvidence.test.js",
  "tests/unit/soundSeekersEvidenceEligibility.test.js",
  "tests/unit/soundSeekersStateV2.test.js",
  "tests/unit/progressMerge.test.js"
].sort();
assert.equal(expected.length, 25, "Task 2 stages exactly twenty-five paths");
const actual = execFileSync("git", ["diff", "--cached", "--name-only"], {
  encoding: "utf8"
}).trim().split("\n").filter(Boolean).sort();
assert.deepEqual(actual, expected, "abort: cached path set is not exactly Task 2");
NODE
git diff --cached --check
git diff --cached -- src/features/soundSeekers/content/heartWordRecords.js src/features/soundSeekers/content/heartWords.js src/features/soundSeekers/content/contentDeckRecords.js src/features/soundSeekers/content/contentDeckBindings.js src/features/soundSeekers/content/contentDeckCatalogs.js src/features/soundSeekers/engine/contentDeckState.js src/features/soundSeekers/engine/contentDeckScheduler.js src/features/soundSeekers/engine/contentDeckTransactions.js src/features/soundSeekers/engine/contentCoverage.js src/features/soundSeekers/engine/evidence.js src/features/soundSeekers/engine/evidenceEligibility.js src/features/soundSeekers/engine/stateV2.js supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql tools/runSoundSeekersContentDeckSqlSelftest.mjs tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentTransactions.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/runSoundSeekersContentDeckSqlSelftest.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersEvidenceEligibility.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js
git commit -m "feat: complete the Sound Seekers word coverage journey"
```

### Task 3: Author 40 composite scenes, concrete meaning support, narration, and relationship arcs

**Dependency stop:** Do not begin this task from uncommitted Task 1 or Task 2 work. The reviewed Task 1 expedition/content-identity implementation and reviewed Task 2 catalogs/scheduler/state implementation must each be committed, their focused tests must pass at those commits, and this task must import their actual exported records rather than restating a planned shape. If either dependency is still under review or its scoped paths are dirty, stop and report Task 3 blocked.

**Files:**
- Create: `src/features/soundSeekers/content/connectedTextRecords.js`
- Create: `src/features/soundSeekers/content/connectedTextAnswerKeys.js`
- Create: `src/features/soundSeekers/content/connectedText.js`
- Create: `src/features/soundSeekers/engine/connectedTextPresentation.js`
- Create generated: `src/features/soundSeekers/content/connectedTextUsage.generated.js`
- Create: `src/features/soundSeekers/content/meaningSupportRecords.js`
- Create: `src/features/soundSeekers/content/meaningSupport.js`
- Create: `src/features/soundSeekers/content/castArcs.js`
- Create: `src/features/soundSeekers/content/sceneVisualSemantics.js`
- Create: `tools/buildSoundSeekersConnectedTextUsage.mjs`
- Create: `tools/generateSoundSeekersSceneAudio.mjs`
- Create: `tools/checkSoundSeekersSceneAudio.mjs`
- Create: `public/audio/quest-v2/SOURCE.md`
- Create: `public/audio/quest-v2/scenes/scene-s1-text.mp3` through `scene-s40-text.mp3`
- Create: `public/audio/quest-v2/scenes/scene-s1-prompt.mp3` through `scene-s40-prompt.mp3`
- Create derived: `public/audio/quest-v2/meaning/` containing one MP3 named from each record's validated lowercase `wordId` in the exact required meaning-support set
- Regenerate: `src/data/generated/audioFilePaths.generated.js`
- Regenerate: `src/data/generated/audioQuestPaths.generated.js`
- Create: `tests/unit/soundSeekersConnectedText.test.js`
- Create: `tests/unit/soundSeekersConnectedTextPresentation.test.js`
- Create: `tests/unit/soundSeekersConnectedTextGenerator.test.js`
- Create: `tests/unit/soundSeekersMeaningSupport.test.js`
- Create: `tests/unit/soundSeekersCastArcs.test.js`
- Create: `tests/unit/soundSeekersSceneAudio.test.js`

`connectedTextRecords.js`, `meaningSupportRecords.js`, and `sceneVisualSemantics.js` are pure authored data and may be imported by offline generators. They do not import generated pronunciation modules, deck state, React, Phaser, assets, or Task 4. `connectedTextRecords.js` contains one uniform child-safe option shape and no evaluator metadata. `sceneVisualSemantics.js` may import only `CONNECTED_TEXT_RECORDS` from `connectedTextRecords.js` and the authored records from `meaningSupportRecords.js`; it must never import `connectedTextAnswerKeys.js`, a reducer challenge, or a child projection. `connectedText.js` is the validating runtime join. `connectedTextAnswerKeys.js` exports only `CONNECTED_TEXT_DECISION_FEEDBACK`, which owns every reducer-private misconception, correction, rationale, and forbidden-prompt map, but **not** a second expected-token authority. `connectedText.js` derives each assessed `CONNECTED_TEXT_EVALUATORS[sceneId].expectedToken` only from the exact Task 2 transfer record `decisionContract`, joins that to `CONNECTED_TEXT_DECISION_FEEDBACK[sceneId]`, and rejects any child-option token set or semantic rationale map that does not join that contract. Neither private export may be re-exported through a child-facing catalog, visual module, or public barrel. `connectedTextPresentation.js` is the sole authority that converts a canonically recorded Task 2 story/transfer attempt into a presentation transition: an authenticated pending incorrect attempt may produce correction, while only the authenticated final reciprocal pair may produce action/resolved/meaning states. No visual, preview, or runtime module may author a transition literal or infer one from a boolean. `connectedTextUsage.generated.js` records where immutable pronunciation IDs are used; it does not mutate pronunciation truth.

**Interfaces:**
- Consumes Task 1 `SOUND_SEEKERS_EXPEDITIONS`, `SOUND_SEEKERS_INTERACTION_CONTEXTS`, `CONNECTED_TEXT_IDS`, exact story/transfer slot IDs, transfer action/context/instruction/power/domain identities, chapter/cast identities, and payoff repair/relationship/consequence IDs.
- Consumes Task 2 `getContentDeckCatalog("stories")`, `getContentDeckCatalog("transfer")`, `getContentDeckCatalogRecord(category,recordId)`, `beginStoryTransferTransaction(state,{stopId,journeyStep,seed})`, `checkpointStoryTransferTransaction(state,{transactionId,narrativeChoiceToken})`, `resumeStoryTransferTransaction(state,{transactionId})`, `materializeStoryTransferChallenge(state,{transactionId})`, `materializeBossTransferChallenge(state,{transactionId})`, `projectBossTransferOptionsForChild(state,{transactionId})`, `completeStoryTransferTransaction(state,{transactionId,challenge,response,audio,at,sessionDay})`, `completeStoryTransferCorrectionModel(state,{transactionId})`, `rehydrateServedContentInstance(contentDecks,{category,visitId})`, `validAttemptReceipts(state)`, `validContentDeckUses(state,category)`, the high-frequency introduction schedule, and the canonical one-record-per-structural-slot story and transfer records. The Task 3 compatibility and presentation fixtures use those committed Task 2 validators/reducers directly; they never inspect raw `state.attemptReceipts`, substitute a mock transaction, a caller-authored non-boss key, a hand-authored use/event, a singleton boss challenge, retained caller narrative memory, or a foundation-only evidence call.
- Consumes foundation `createSoundSeekersState()`, `normalizeSoundSeekersState()`, `validateQuestChallenge()`, `toChildChallengeView()`, `createLiteracyDecision()`, `bossNovelTargetId()`, and the exact evidence rules. A connected-text reducer challenge is `{targetId: "text:" + sceneId, connectedTextId: sceneId, recordsDomain: "connected_text_transfer"}` and omits word, position, boss, and activity identity. Its canonical `createLiteracyDecision()` event retains `connectedTextId`, stores `word:null`, `position:null`, and `bossTransferId:null`, and omits the `activityType` property entirely. Boss evidence remains the Task 1 `{targetId: bossNovelTargetId({wordId,bossTransferId}), wordId, position:"whole", bossTransferId, recordsDomain:"novel_decoding"}` path and is not duplicated by a story choice.
- Consumes Task 1 `PRONUNCIATION_CORPUS_RECORD_IDS`, `PRONUNCIATION_CORPUS_RECORD_COUNT`, and `PRONUNCIATION_CORPUS_CONTENT_HASH` only as immutable pronunciation truth. This task must leave `pronunciationRecords.js`, `pronunciationCorpusInvariant.generated.js`, `pronunciationLexicon.js`, `wordMeanings.js`, and `buildSoundSeekersPronunciationLexicon.mjs` byte-for-byte unchanged.
- Produces child-safe `CONNECTED_TEXT_RECORDS`, validated `SOUND_SEEKERS_CONNECTED_TEXT`, direct reducer/validator-only `getConnectedText(sceneId)`, `toChildConnectedTextScene(sceneId,routeSeed)`, reducer-private `CONNECTED_TEXT_EVALUATORS`, `createConnectedTextChallenge(state,{transactionId,routeSeed})`, and `evaluateConnectedTextDecision(sceneId,selectedToken)`, plus `validateSceneAtStop(scene,stopId)`, `tokenizeConnectedText(text)`, and `readabilityBandForStop(stopIndex)`. `createConnectedTextChallenge()` requires a live non-boss pending Task 2 transaction and returns the object-identical `materializeStoryTransferChallenge()` result only after joining its three tokens/key to the assessed scene/evaluator; it returns `null` for bosses. Renderers may import only `toChildConnectedTextScene()` from the connected-text boundary; neither child projection exposes a private evaluator, catalog/transfer reference, authored audit provenance, problem/repair/relationship/consequence identity, narrative-branch outcome, or post-decision visual semantic ID.
- Produces `REQUIRED_ACTION_MEANING_WORD_IDS`, `CONNECTED_TEXT_USAGE`, `ADVANCED_SCENE_TOKEN_IDS`, `ADVANCED_SCENE_TOKEN_COUNT`, `ADVANCED_SCENE_TOKEN_CONTENT_HASH`, `MEANING_SUPPORT_RECORDS`, `SOUND_SEEKERS_MEANING_SUPPORT`, and `getMeaningSupport(wordId)` without adding tags, `taughtAt`, scene IDs, or other usage provenance to pronunciation records.
- Produces `SOUND_SEEKERS_CAST_ARCS` with exactly eight identity/relationship-only arcs, the existing 32 identities, the exact 40 Task 1 relationship beats, and `getCastRelationshipBeat(relationshipBeatId)`. Each returned frozen beat has exact keys `{id,chapterId,stopId,residentId,repairId,consequenceId,callbackRepairIds,callbackLines}`; `callbackLines` is an ordered bijection of exact `{repairId,text}` records over `callbackRepairIds`. Visual style, body shape, palette, features, props, and pose enrichment belong only to Task 4 `characterCatalog.js`.
- Produces pure `SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS`, `SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS`, `SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS`, `SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS`, `SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES`, `SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS`, `SOUND_SEEKERS_MEANING_VISUAL_OWNERS`, the frozen-array `SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY`, `getSceneVisualSemantics(sceneId)`, `resolveNarrativeBranchOutcome(sceneId,narrativeChoiceToken)`, and `resolveSceneVisualSemantic(semanticId)` for Task 4. The registry contains 40 scene links, 40 answer-neutral pre-choice records, exactly 112 equal-frame option records, exactly 48 post-decision records (one for each of 32 assessed scenes and two branch-specific records for each of eight narrative scenes), and one meaning semantic record per meaning-support record. The 16 frozen narrative-branch records have exact keys `{sceneId,token,storyOutcomeId,postDecisionSemanticId}`; within each boss scene they bijectively join the two authored option tokens to two distinct outcome IDs and two distinct post-decision records. `SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS` is derived directly from `MEANING_SUPPORT_RECORDS`, preserving each exact `visualSemanticId` and `wordId`; it is not derived from a runtime projection or alias table. The union of all 48 post-decision `meaningSemanticIds` must equal that complete meaning-semantic set. `SOUND_SEEKERS_MEANING_VISUAL_OWNERS` then contains exactly one frozen `{meaningSemanticId,sceneId,postDecisionSemanticId}` record per meaning, choosing the earliest numeric stop and then canonical post-decision order whose record references it; it is deterministic reachability metadata, never an alias or answer key. The registry contains no file path, CSS, JSX, renderer instruction, assessed answer token, evaluator map, feedback, score, or correctness flag.
- Produces `beginConnectedTextPresentation({sceneId,transactionId})`, `reduceConnectedTextPresentation(presentation,event,{state})`, `checkpointConnectedTextPresentation(presentation)`, `rehydrateConnectedTextPresentation(state,checkpoint)`, `closeConnectedTextPresentation(presentation)`, `isConnectedTextPresentationTransition(value)`, and `projectConnectedTextPresentationTransition(value)`. Only the last two are Task 4 imports. The presentation module exports no brand, generation token, constructor shortcut, correctness setter, evidence constructor, answer key, or mutable registry.
- Produces exactly 40 scene-text audio assets, exactly 40 prompt assets, the derived meaning-support asset set, a hash-bound provenance manifest, and offline `assertSoundSeekersSceneAudio()` validation.

The authored scene has this exact shape; the two catalog references make story ownership and transfer ownership explicit rather than treating one record as both. Rendering receives the smaller view returned by `toChildConnectedTextScene()`:

```js
{
  id: "scene-s1",
  stopId: "s1",
  chapterId: "seedwake-meadow",
  storyRef: {
    category: "stories",
    slotId: "story-slot-s1",
    recordId: "story:scene-s1",
    contentId: "scene-s1"
  },
  transferRef: {
    category: "transfer",
    slotId: "transfer-slot-s1",
    recordId: "transfer:s1",
    actionId: "s1-transfer",
    configurationId: "s1-transfer-configuration",
    contextId: "s1-controlled-scene",
    connectedTextId: "scene-s1",
    instructionId: "story-power-choose-story-action",
    powerId: "story_power",
    expectedAction: "choose_story_action",
    recordsDomain: "connected_text_transfer",
    wordId: null,
    bossTransferId: null
  },
  residentId: "Moss",
  problemId: "seed-lanterns-dark",
  consequencePreviewId: "seedwake-path-dark",
  repairId: "wake-seeds",
  relationshipBeatId: "seedwake-s1-moss-trust",
  consequenceId: "seedwake-path-lit",
  level: "phrase",
  text: "A mat.",
  tokenIds: ["hw:a", "mat"],
  heartWordIds: ["hw:a"],
  advancedTokenIds: [],
  advancedTokenAudit: [],
  advancedTokenAuditDecision: {
    status: "reviewed_none_required",
    reviewerRole: "literacy-content-review",
    reviewedAt: "2026-09-02T00:00:00.000Z",
    evidenceRef: "task3:scene-s1:advanced-token-audit"
  },
  textAudioKey: "quest/scenes/scene-s1/text",
  prompt: {
    text: "Which repair matches the words?",
    audioKey: "quest/scenes/scene-s1/prompt"
  },
  choice: {
    kind: "assessed_connected_text",
    comparisonFamilyId: "scene-s1-repair-actions",
    options: [
      {
        token: "ct-s1-b",
        presentation: "image",
        childLabel: "Use the mat.",
        accessibleLabel: "Use the mat.",
        visualSemanticId: "scene-s1-option-use-mat"
      },
      {
        token: "ct-s1-a",
        presentation: "image",
        childLabel: "Ring the bell.",
        accessibleLabel: "Ring the bell.",
        visualSemanticId: "scene-s1-option-ring-bell"
      },
      {
        token: "ct-s1-c",
        presentation: "image",
        childLabel: "Lift the lantern.",
        accessibleLabel: "Lift the lantern.",
        visualSemanticId: "scene-s1-option-lift-lantern"
      }
    ]
  },
  visualSemanticId: "scene-s1-visual"
}
```

`toChildConnectedTextScene(sceneId,routeSeed)` returns exactly this minimal frozen shape and no other top-level or nested key:

```js
{
  id: "scene-s1",
  stopId: "s1",
  chapterId: "seedwake-meadow",
  residentId: "Moss",
  level: "phrase",
  text: "A mat.",
  textAudioKey: "quest/scenes/scene-s1/text",
  prompt: {
    text: "Which repair matches the words?",
    audioKey: "quest/scenes/scene-s1/prompt"
  },
  choice: {
    kind: "assessed_connected_text",
    options: [
      {
        token: "ct-s1-b",
        presentation: "image",
        childLabel: "Use the mat.",
        accessibleLabel: "Use the mat.",
        visualSemanticId: "scene-s1-option-use-mat"
      },
      {
        token: "ct-s1-a",
        presentation: "image",
        childLabel: "Ring the bell.",
        accessibleLabel: "Ring the bell.",
        visualSemanticId: "scene-s1-option-ring-bell"
      },
      {
        token: "ct-s1-c",
        presentation: "image",
        childLabel: "Lift the lantern.",
        accessibleLabel: "Lift the lantern.",
        visualSemanticId: "scene-s1-option-lift-lantern"
      }
    ]
  },
  preChoiceSemanticId: "scene-s1-pre-choice",
  visualSemanticId: "scene-s1-visual"
}
```

Every authored scene also has exact top-level `narrativeBranches`: `[]` for each assessed scene and exactly two frozen records for each boss scene. A boss branch is exactly `{token,storyOutcomeId,postDecisionSemanticId}`. Its token bijectively equals one of that scene's two five-field child options; both `storyOutcomeId` values and both `postDecisionSemanticId` values are distinct within the scene. The branch records contain no correctness, score, evidence domain, boss answer, reward quantity, or mastery field. The persisted Task 2 `narrativeChoiceToken` is the only saved selection authority; Task 3 resolves the branch from it after completion or reload and never trusts retained caller memory.

The child projection omits `storyRef`, `transferRef`, `problemId`, `consequencePreviewId`, `repairId`, `relationshipBeatId`, `consequenceId`, `narrativeBranches`, `tokenIds`, `heartWordIds`, every advanced-token audit/provenance field, every evaluator/evidence field, every story outcome, and every post-decision semantic ID. Its neutral `residentId` and scene-link `visualSemanticId` are retained because Task 4 validates both against the split semantic/cast registry; neither identifies an answer or outcome. A renderer may not import `connectedTextRecords.js`, `connectedTextAnswerKeys.js`, `CONNECTED_TEXT_RECORDS`, `CONNECTED_TEXT_EVALUATORS`, `getConnectedText()`, `createConnectedTextChallenge()`, `evaluateConnectedTextDecision()`, or `resolveNarrativeBranchOutcome()`; it consumes only this projection. `routeSeed` may change only option order and never the option tokens, shapes, reducer key, or branch mapping.

`connectedTextPresentation.js` owns an in-memory state machine and its transitions. It imports the real Task 2 `validAttemptReceipts(state)`, `validContentDeckUses(state,category)`, `rehydrateServedContentInstance()`, and canonical story/transfer catalog lookup plus Task 3 `getConnectedText()`, `evaluateConnectedTextDecision()`, `getSceneVisualSemantics()`, `resolveNarrativeBranchOutcome()`, `resolveSceneVisualSemantic()`, and `getMeaningSupport()`. It never reads raw `state.attemptReceipts`, treats structural raw uses as valid, reconstructs a receipt normalizer, or imports Task 4 code. Module-private `WeakSet`s brand presentation states and transitions; module-private `WeakMap`s bind each branded object to a non-exported generation object; and one module-private active-presentation registry retains exactly `{generation,currentState,currentTransition,sceneId,transactionId,reducerRevision}`. Beginning any scene or rehydrating any checkpoint first invalidates the previous active presentation, even when its scene/transaction differs. Each accepted reduction atomically retires the prior state and transition identities and installs only the returned `nextPresentation` and `transition` at the next exact revision. Every public state and transition is recursively frozen after branding; a literal, `Object.freeze()` lookalike, spread, `structuredClone()`, JSON round trip, prior-revision object, prior-scene object, or object from another module instance is rejected even when every enumerable field matches. The registry exposes no iterator or lookup API.

`beginConnectedTextPresentation({sceneId,transactionId})` validates exact non-empty IDs and the canonical Task 3 scene, invalidates any active presentation, installs a fresh generation whose revision-zero state is the sole exact-current state, then returns:

```js
{
  kind: "connected_text_presentation",
  sceneId,
  transactionId,
  attemptId: null,
  phase: "pre_choice",
  reducerRevision: 0,
  history: []
}
```

`reduceConnectedTextPresentation(presentation,event,{state})` accepts only a currently branded state and one exact event shape whose `reducerRevision` equals the state's current revision. `state` is the complete Task 2-compatible quest state with all five `contentDecks` categories and its canonical evidence collection; a category fragment or caller-projected event list is invalid. The allowed reducer events are exactly:

```js
{ type: "decision_committed", reducerRevision, evidenceEventId }
{ type: "action_completed", reducerRevision }
{ type: "meaning_requested", reducerRevision, meaningSemanticId }
```

At `decision_committed`, the reducer requires exactly one non-conflict evidence event with the supplied ID and derives that event's attempt ID from its canonical immutable ID; callers never supply an attempt or selected token. Before accepting any event, private `verifyConnectedTextHistoryAgainstTask2(state,{sceneId,transactionId,history})` validates the complete candidate history, not merely its newest entry, through exactly one of two mutually exclusive authorities:

1. **Pending incorrect history:** no `validContentDeckUses(state,"stories")`/`validContentDeckUses(state,"transfer")` reciprocal pair exists; `checkpoint.storyTransfer` names this exact transaction, visits, scene/stop/journey identity, and current fresh attempt ordinal `N`; its stage is exactly `response_pending`, except that immediately after the third miss it may be exactly `model_pending`; the decision subsequence contains exactly attempts `0..N-1` in order; every decision ID occurs exactly once in canonical evidence and in the matching record returned by `validAttemptReceipts(state)`; every receipt is `completed:false`, has operation `story_transfer`, names this transaction, has the canonical input hash, and the corresponding event is incorrect. There are no missing, duplicated, later, foreign, conflicted, raw-only, or correct decisions. The reducer rehydrates both visits and the transfer record and verifies the complete Task 1 tuple. Every newest wrong receipt—including the third receipt that leaves Task 2 in `model_pending`—advances or remains in `phase:"correction"` and produces one exact-current branded correction transition whose `postDecisionSemanticId`, `storyOutcomeId`, and `meaningSemanticId` are all `null`. The persisted checkpoint's current fresh attempt `N` itself has no response receipt yet. Calling Task 2 `completeStoryTransferCorrectionModel()` records no presentation event or revision; after that call the same correction history revalidates against `response_pending`, and only the later fresh response can advance the presentation.
2. **Completed correct history:** no pending story-transfer checkpoint remains; exactly one pair returned by `validContentDeckUses(state,"stories")` and `validContentDeckUses(state,"transfer")` exists for this transaction; the decision subsequence contains exactly contiguous attempts `0..N`; every decision has the matching canonical non-conflict record from `validAttemptReceipts(state)` and canonical evidence identity described above; attempts `0..N-1` are incorrect with `completed:false`; attempt `N` is correct with `completed:true`; and both reciprocal uses name only that final event ID, the same complete attempt-receipt chain, and the same canonical `narrativeChoiceToken`. Both visits rehydrate canonically. Only the final decision may advance from `pre_choice` or `correction` to `phase:"action"`.

For an assessed scene, the reducer derives the selected token from the private evaluator: the expected token for a correct event and the exact normalized evidence confusion token for an incorrect event. It requires the evaluator result to agree with event correctness/confusion. For a boss scene, the story selection is never inferred from the separately assessed boss response: while pending it is read only from `checkpoint.storyTransfer.narrativeChoiceToken`, and after completion it is read only from the exactly equal token on both valid reciprocal uses. The value must resolve through `resolveNarrativeBranchOutcome(sceneId,token)` to one of that scene's two canonical narrative branches. While any boss attempt is wrong, that outcome remains undisclosed and creates no payoff. At final completion the reducer derives the exact `storyOutcomeId` and branch-specific `postDecisionSemanticId` from the persisted token; action, resolved, meaning, checkpoint replay, and reload retain those same derived identities without serializing either as a second authority. A missing/mismatched pair token, retained caller token, duplicate/conflicted/raw-only use, wrong attempt sequence, wrong scene/transaction, or merely shape-compatible event fails. In all cases non-heart `activityType` is absent and the canonical word/position/text/boss nulls remain exact.

The reducer accepts no `correct`, `isCorrect`, selected token, narrative token, story outcome, post-decision semantic ID, attempt ID, phase, result, or feedback input. A `correction` state may accept only the next canonical `decision_committed`; another wrong event produces the next correction revision and a correct completed-pair event produces `action`. A Task 2 correction-model completion changes no presentation state: the exact current correction presentation remains valid while its whole history revalidates against the modeled Task 2 state, and the model cannot be represented as a caller event. Only `action_completed` at the current action revision advances to the next `resolved` revision. Only the current `resolved` state may accept `meaning_requested`; the requested ID must occur directly in the exact authenticated post-decision record's `meaningSemanticIds`, resolve as `kind:"meaning"`, join the exact public support record by word ID, and carry `answerLeakPolicy:"post_decision_or_non_assessed_help"`. It advances to the next `meaning_support` revision. No reducer event may skip, repeat, reverse, or mutate a phase. Every accepted event is copied into the frozen `history`; no caller event object is retained.

Each accepted reducer event returns exactly `{nextPresentation,transition}`. The branded transition has exact enumerable fields `{kind:"connected_text_presentation_transition",sceneId,transactionId,attemptId,evidenceEventId,reducerRevision,phase,correctionRecordId,postDecisionSemanticId,storyOutcomeId,meaningSemanticId}`. It contains no selected/narrative token, correctness, score, feedback, rationale, correction payload, evidence payload, or answer identity. `correctionRecordId` is the exact `wrong.correction.correctionRecordId` independently matched to the current valid receipt and is non-null only on a correction transition; no `id`, `correctionId`, or caller-supplied alternate is accepted. `postDecisionSemanticId` is `null` on every correction; it is the one assessed record or the canonically selected branch record on action/resolved/meaning. `storyOutcomeId` is non-null only for a completed boss branch and remains stable across those later phases. `isConnectedTextPresentationTransition()` returns true only when the exact object identity is branded **and** equals the active registry's exact `currentTransition` at its exact scene, transaction, generation, and revision. `projectConnectedTextPresentationTransition()` first requires that exact-current authority and returns a new recursively frozen identity projection with exact fields `{sceneId,transactionId,attemptId,decisionId:evidenceEventId,reducerRevision,phase,correctionRecordId,postDecisionSemanticId,storyOutcomeId,meaningSemanticId}`; the projection is data, never an independent authority. A transition becomes invalid immediately when the reducer advances one revision, any later `begin`/rehydrate starts any presentation, or the active presentation closes. The predecessor presentation state is likewise invalid as soon as the reducer accepts an event.

`checkpointConnectedTextPresentation()` accepts only the exact active `currentState` and returns strict serializable data with exact keys `{schemaVersion:1,kind:"connected_text_presentation_checkpoint",sceneId,transactionId,history}`. History uses only the three exact reducer-event shapes above and contains no caller-selected token, attempt ID, derived phase/correctness/semantic result, generation, brand, state snapshot, capability, or Task 2 event/use copy. `rehydrateConnectedTextPresentation(state,checkpoint)` rejects prototypes other than plain object/array, symbols, accessors, functions, non-JSON values, extra/missing keys, wrong types, unknown schema/event, non-contiguous revisions, or an impossible event order. It first calls the private whole-history verifier once against the complete current Task 2 state. A second private replay builder then derives every phase, attempt ID, evidence ID, post-decision semantic, and meaning semantic from that verified history without calling the public reducer against historical Task 2 prefixes and without exposing or registering intermediate states/transitions. Only after the whole verification and replay succeed does it invalidate the previous active presentation and atomically install one fresh generation containing the rebuilt final state and final transition; empty history installs revision-zero pre-choice with `transition:null`. It never trusts or restores a phase/revision/attempt from serialized data. Any wrong scene, transaction, missing or reordered attempt receipt/evidence ID, non-contiguous decision attempt, phase order, revision, or meaning ID fails before registry mutation. Every pre-resume state/transition immediately fails exact-current predicates, and because Task 4 validation rechecks the source transition, every old visual capability fails too.

`closeConnectedTextPresentation(presentation)` is the sole explicit leave/unmount hook. It accepts only the exact active `currentState`, atomically clears the active registry, invalidates that state, its current transition, and every Task 4 capability issued from it, and returns `true`. A stale, cloned, prior-revision, cross-scene, or already-closed state throws without changing the registry. Production route teardown, route leave, React cleanup/unmount, and scene replacement must call it on the exact active presentation **before** dropping or replacing the reference; beginning a new presentation also invalidates the old one defensively. The later production mission lifecycle tests must exercise replacement and unmount through the real controller/component path and prove the old transition/capability fails immediately, rather than accepting a source-presence assertion as lifecycle evidence.

Every child option in assessed and narrative source records has exactly `{token,presentation,childLabel,accessibleLabel,visualSemanticId}` with the same field presence and value types. No option contains a null sentinel, rationale, misconception, correction, feedback, expected token, answer position, or correctness marker. The Task 2 catalogs must expose the exact canonical record IDs `story:scene-s1` through `story:scene-s40` and `transfer:s1` through `transfer:s40`; Task 3 verifies those imported IDs and never creates aliases. An assessed source record and its child projection contain no `correct`, `correctness`, `isCorrect`, `isKey`, `answerIndex`, `answerKey`, `keyIndex`, `expectedToken`, `feedback`, `score`, rationale, misconception, or correction property. The assembled reducer-private evaluator lives only in `connectedText.js` and has this exact shape. Its `expectedToken` is derived from the Task 2 transfer contract; `connectedTextAnswerKeys.js` contributes only the feedback/forbidden-prompt maps and never owns or exports an expected token:

```js
{
  "scene-s1": {
    expectedToken: "ct-s1-b", // derived from Task 2 transfer:s1 decisionContract
    forbiddenPromptTokens: ["mat"],
    misconceptionByToken: {
      "ct-s1-a": "unsupported_world_action",
      "ct-s1-c": "visible_prop_not_named_in_text"
    },
    correctionByToken: {
      "ct-s1-a": "Read the words again. Choose the action that uses a mat.",
      "ct-s1-c": "Find the object named in the words."
    },
    rationaleByToken: {
      "ct-s1-b": "The decoded text names the mat used by this action.",
      "ct-s1-a": "The bell is a plausible world action, but the text does not name it.",
      "ct-s1-c": "The lantern is visible in the world, but the text names a mat."
    },
    evidence: {
      targetId: "text:scene-s1",
      connectedTextId: "scene-s1",
      recordsDomain: "connected_text_transfer"
    }
  }
}
```

For every assessed scene, `expectedToken` is imported only from its Task 2 transfer `decisionContract` and is one exact child option token; `misconceptionByToken` and `correctionByToken` have exactly the two non-key tokens; and `rationaleByToken` has exactly all three option tokens. Values are short, scene-specific, non-generic strings. `evaluateConnectedTextDecision()` validates the selected token, scores before feedback, and returns the applicable private rationale plus misconception/correction only after a decision. `createConnectedTextChallenge(state,{transactionId,routeSeed})` resolves the live pending transaction/scene, calls Task 2 `materializeStoryTransferChallenge()`, requires exact token-set/key/tuple agreement with the validated evaluator and route-ordered child options, then returns that object-identical canonical challenge. It accepts no caller attempt ID, expected token, option tokens, or scene override. Only `toChildChallengeView()` or `toChildConnectedTextScene()` reaches rendering; neither exposes the evaluator, forbidden tokens, maps, branch outcomes, post-decision semantic IDs, or a correctness marker. The eight boss-stop scenes use `choice.kind: "narrative_bridge"`, two meaningful non-assessed narrative options, no evaluator entry, and no connected-text evidence. Each option maps through the scene's authored `narrativeBranches` to a distinct persistent `storyOutcomeId` and branch-specific post-decision semantic. The selection is checkpointed before the separately assessed boss attempt, remains byte-identical across correction/model/retry and both final uses, and is rederived after reload; it never changes the boss challenge or creates an evidence event. Their exact Task 1 transfer record remains the separately assessed `novel_decoding` boss; `createConnectedTextChallenge()` returns `null` for the narrative story choice and may not duplicate the boss answer.

A scene with advanced vocabulary uses `advancedTokenAudit` entries of exact shape `{tokenId,tokenOrdinal,advancedReason}`. `tokenOrdinal` is the zero-based occurrence in that scene's full ordered `tokenIds`, not an index in a deduplicated list. `advancedTokenIds` is the sorted unique projection of those entries. `advancedTokenAuditDecision` reviews the whole scene audit, including an explicit `reviewed_none_required` decision for an empty projection.

The five deterministic readability bands are:

| Stops | `level` | Running-text limits |
|---|---|---|
| `s1`-`s8` | `phrase` | 2-5 tokens, exactly 1 sentence |
| `s9`-`s16` | `sentence` | 5-9 tokens, exactly 1 sentence |
| `s17`-`s24` | `paired_sentences` | 8-16 tokens, exactly 2 sentences |
| `s25`-`s32` | `micro_scene` | 12-24 tokens, 2-3 sentences |
| `s33`-`s40` | `short_passage` | 18-32 tokens, 2-4 sentences |

`tokenizeConnectedText()` applies Unicode NFKC, converts curly apostrophes to `'`, lowercases with `en-US`, and returns `/[a-z]+(?:'[a-z]+)?/gu` matches in displayed order, including repeats. `tokenIds` must exactly resolve that ordered surface list through the pronunciation catalog and the explicitly listed `heartWordIds`; punctuation may not hide or fuse a token. Every running-text token and every `childLabel` that any presentation actually renders must be independently readable at that stop from taught pronunciation targets plus already introduced Task 2 high-frequency words. A `presentation:"text"` option always renders its `childLabel`; a `presentation:"image"` option may render that label only when the same readability check passes, otherwise the string remains nonvisual. Prompts are one sentence of at most ten tokens; every visible `childLabel` is at most six tokens. `accessibleLabel` is semantic accessibility copy, never rendered text; it may be richer than `childLabel` only because the active assistive-technology path announces it audibly, and it is never counted as independently decoded text or used as phonics evidence. A non-rendered accessible label without that semantic audio-announcement path is invalid.

- [ ] **Step 1: Write failing identity, evidence, readability, meaning, cast, visual, generator, and audio tests**

```js
test("forty composite scenes bijectively join forty story and forty transfer owners", () => {
  const stories = getContentDeckCatalog("stories");
  const transfers = getContentDeckCatalog("transfer");
  assert.equal(SOUND_SEEKERS_CONNECTED_TEXT.length, 40);
  assert.equal(new Set(SOUND_SEEKERS_CONNECTED_TEXT.map(scene => scene.storyRef.recordId)).size, 40);
  assert.equal(new Set(SOUND_SEEKERS_CONNECTED_TEXT.map(scene => scene.transferRef.recordId)).size, 40);

  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const scene = getConnectedText(expedition.connectedTextId);
    const transfer = expedition.phases.find(phase => phase.id === `${expedition.stopId}-transfer`);
    assert.equal(scene.stopId, expedition.stopId);
    assert.equal(scene.storyRef.slotId, expedition.contentDeckSlotIds.stories[0]);
    assert.equal(scene.transferRef.slotId, expedition.contentDeckSlotIds.transfer[0]);
    assert.equal(scene.transferRef.actionId, transfer.id);
    assert.equal(scene.transferRef.configurationId, transfer.configurationId);
    assert.equal(scene.transferRef.contextId, transfer.contextId);
    assert.equal(scene.transferRef.connectedTextId, transfer.connectedTextId);
    assert.deepEqual({
      instructionId: scene.transferRef.instructionId,
      powerId: scene.transferRef.powerId,
      expectedAction: scene.transferRef.expectedAction,
      recordsDomain: scene.transferRef.recordsDomain
    }, {
      instructionId: transfer.instructionId,
      powerId: transfer.powerId,
      expectedAction: transfer.expectedAction,
      recordsDomain: transfer.recordsDomain
    });
    assert.equal(stories.find(record => record.recordId === scene.storyRef.recordId).contentId, scene.id);
    assertTransferRecordMatchesAction(
      transfers.find(record => record.recordId === scene.transferRef.recordId),
      transfer
    );
    if (expedition.transfer.boss) {
      assert.equal(scene.transferRef.wordId, transfer.wordId);
      assert.equal(scene.transferRef.bossTransferId, transfer.contextId);
      assert.equal(transfer.recordsDomain, "novel_decoding");
      assert.equal(transfer.connectedTextId, scene.id);
    } else {
      assert.equal(scene.transferRef.wordId, null);
      assert.equal(scene.transferRef.bossTransferId, null);
      assert.equal(transfer.recordsDomain, "connected_text_transfer");
    }
    assert.equal(scene.repairId, expedition.payoff.repairId);
    assert.equal(scene.relationshipBeatId, expedition.payoff.relationshipBeatId);
    assert.equal(scene.consequenceId, expedition.payoff.consequenceId);
    assert.equal(scene.problemId, expedition.arrival.problemId);
    assert.equal(scene.consequencePreviewId, expedition.arrival.consequencePreviewId);
  }
});

test("thirty-two text decisions record exact evidence while eight boss stories stay narrative", () => {
  const assessed = SOUND_SEEKERS_CONNECTED_TEXT.filter(scene => scene.choice.kind === "assessed_connected_text");
  const narrative = SOUND_SEEKERS_CONNECTED_TEXT.filter(scene => scene.choice.kind === "narrative_bridge");
  assert.equal(assessed.length, 32);
  assert.equal(narrative.length, 8);
  assert.deepEqual(
    narrative.map(scene => scene.stopId),
    SOUND_SEEKERS_EXPEDITIONS.filter(expedition => expedition.transfer.boss).map(expedition => expedition.stopId)
  );

  for (const scene of assessed) {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === scene.stopId);
    const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
      stopId: scene.stopId, journeyStep: expedition.stopIndex, seed: expedition.stopIndex
    });
    const pending = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId: begun.transaction.transactionId, narrativeChoiceToken: null
    });
    const challenge = createConnectedTextChallenge(pending, {
      transactionId: begun.transaction.transactionId,
      routeSeed: "route-a"
    });
    assert.strictEqual(challenge, materializeStoryTransferChallenge(pending, {
      transactionId: begun.transaction.transactionId
    }));
    assert.deepEqual(validateQuestChallenge(challenge), { valid: true, errors: [] });
    assert.deepEqual({
      targetId: challenge.targetId,
      connectedTextId: challenge.connectedTextId,
      instructionId: challenge.instructionId,
      expectedAction: challenge.expectedAction,
      recordsDomain: challenge.recordsDomain,
      powerId: challenge.powerId,
      wordId: challenge.wordId,
      position: challenge.position,
      bossTransferId: challenge.bossTransferId,
      activityType: challenge.activityType
    }, {
      targetId: `text:${scene.id}`,
      connectedTextId: scene.id,
      instructionId: scene.transferRef.instructionId,
      expectedAction: scene.transferRef.expectedAction,
      recordsDomain: "connected_text_transfer",
      powerId: scene.transferRef.powerId,
      wordId: undefined,
      position: undefined,
      bossTransferId: undefined,
      activityType: undefined
    });
    assert.equal(Object.hasOwn(toChildChallengeView(challenge), "expectedToken"), false);
    assert.equal(Object.hasOwn(toChildConnectedTextScene(scene.id, "route-a"), "answerKey"), false);
    const event = createLiteracyDecision(validSceneDecision(challenge, challenge.expectedToken));
    assert.deepEqual({
      target: event.target,
      domain: event.domain,
      word: event.word,
      position: event.position,
      connectedTextId: event.connectedTextId,
      bossTransferId: event.bossTransferId,
      hasActivityType: Object.hasOwn(event, "activityType")
    }, {
      target: `text:${scene.id}`,
      domain: "connected_text_transfer",
      word: null,
      position: null,
      connectedTextId: scene.id,
      bossTransferId: null,
      hasActivityType: false
    });
  }
  for (const scene of narrative) {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === scene.stopId);
    const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
      stopId: scene.stopId, journeyStep: expedition.stopIndex, seed: expedition.stopIndex
    });
    const narrativeChoiceToken = toChildConnectedTextScene(scene.id, "route-a").choice.options[0].token;
    const pending = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId: begun.transaction.transactionId, narrativeChoiceToken
    });
    assert.equal(createConnectedTextChallenge(pending, {
      transactionId: begun.transaction.transactionId, routeSeed: "route-a"
    }), null);
    assertNoCorrectnessFields(scene.choice);
  }
});

test("all thirty-two real connected-text challenges complete through one Task 2 transaction state", () => {
  let state = createSoundSeekersState();
  const assessed = SOUND_SEEKERS_CONNECTED_TEXT
    .filter(scene => scene.choice.kind === "assessed_connected_text");
  for (const scene of assessed) {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === scene.stopId);
    const begun = beginStoryTransferTransaction(state, {
      stopId: scene.stopId,
      journeyStep: expedition.stopIndex,
      seed: expedition.stopIndex
    });
    state = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId: begun.transaction.transactionId,
      narrativeChoiceToken: null
    });
    const challenge = createConnectedTextChallenge(state, {
      transactionId: begun.transaction.transactionId,
      routeSeed: "task3-compatibility-route"
    });
    assert.deepEqual({
      instructionId: challenge.instructionId,
      powerId: challenge.powerId,
      expectedAction: challenge.expectedAction,
      recordsDomain: challenge.recordsDomain
    }, {
      instructionId: scene.transferRef.instructionId,
      powerId: scene.transferRef.powerId,
      expectedAction: scene.transferRef.expectedAction,
      recordsDomain: scene.transferRef.recordsDomain
    });
    const completed = completeStoryTransferTransaction(state, {
      transactionId: begun.transaction.transactionId,
      challenge,
      response: { kind: "literacy-answer", token: challenge.expectedToken },
      audio: { status: "completed" },
      at: new Date(Date.UTC(2026, 8, 2, 0, expedition.stopIndex, 0)).toISOString(),
      sessionDay: "2026-09-02"
    });
    assert.equal(completed.completed, true);
    state = completed.nextState;
  }
  assert.equal(state.evidence.length, 32);
  assert.equal(validContentDeckUses(state, "stories").length, 32);
  assert.equal(validContentDeckUses(state, "transfer").length, 32);
  assert.equal(state.evidence.every(event => event.domain === "connected_text_transfer"), true);
});

test("all forty scenes obtain branded presentation transitions from real Task 2 completions", () => {
  let state = createSoundSeekersState();
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === scene.stopId);
    const transactionId = `story-transfer:${expedition.stopIndex}:${scene.stopId}`;
    const presentation = beginConnectedTextPresentation({ sceneId: scene.id, transactionId });
    const begun = beginStoryTransferTransaction(state, {
      stopId: scene.stopId, journeyStep: expedition.stopIndex, seed: expedition.stopIndex
    });
    const narrativeChoiceToken = scene.choice.kind === "narrative_bridge"
      ? toChildConnectedTextScene(scene.id, "task3-presentation-route").choice.options[0].token
      : null;
    const pending = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId, narrativeChoiceToken
    });
    assert.equal(pending.checkpoint.storyTransfer.narrativeChoiceToken, narrativeChoiceToken);

    const transferRecord = getContentDeckCatalogRecord("transfer", `transfer:${scene.stopId}`);
    let challenge = scene.choice.kind === "assessed_connected_text"
      ? createConnectedTextChallenge(pending, {
          transactionId, routeSeed: "task3-presentation-route"
        })
      : materializeBossTransferChallenge(pending, { transactionId });
    assert.deepEqual(validateQuestChallenge(challenge), { valid: true, errors: [] });
    assert.deepEqual({
      instructionId: challenge.instructionId,
      powerId: challenge.powerId,
      expectedAction: challenge.expectedAction,
      recordsDomain: challenge.recordsDomain,
      targetId: challenge.targetId
    }, {
      instructionId: transferRecord.instructionId,
      powerId: transferRecord.powerId,
      expectedAction: transferRecord.expectedAction,
      recordsDomain: transferRecord.recordsDomain,
      targetId: transferRecord.targetId
    });
    const wrongToken = challenge.optionTokens.find(token => token !== challenge.expectedToken);
    const wrong = completeStoryTransferTransaction(pending, {
      transactionId,
      challenge,
      response: { kind: "literacy-answer", token: wrongToken },
      audio: { status: "completed" },
      at: new Date(Date.UTC(2026, 8, 2, 1, expedition.stopIndex, 0)).toISOString(),
      sessionDay: "2026-09-02"
    });
    assert.equal(wrong.completed, false);
    const restoredWrongState = normalizeSoundSeekersState(
      JSON.parse(JSON.stringify(wrong.nextState))
    );
    const wrongReceipt = validAttemptReceipts(restoredWrongState)
      .find(receipt => receipt.attemptId === challenge.attemptId);
    assert.ok(wrongReceipt);
    assert.deepEqual(wrongReceipt.eventIds, [wrong.event.id]);
    assert.deepEqual(wrongReceipt.correctionRecordIds,
      [wrong.correction.correctionRecordId]);
    assert.equal(wrongReceipt.completed, false);
    assert.deepEqual(wrongReceipt.useIds, []);
    assert.equal(validContentDeckUses(restoredWrongState, "stories")
      .some(use => use.transactionId === transactionId), false);
    assert.equal(validContentDeckUses(restoredWrongState, "transfer")
      .some(use => use.transactionId === transactionId), false);
    const corrected = reduceConnectedTextPresentation(presentation, {
      type: "decision_committed",
      reducerRevision: 0,
      evidenceEventId: wrong.event.id
    }, { state: restoredWrongState });
    assert.equal(corrected.transition.phase, "correction");
    assert.equal(corrected.transition.correctionRecordId,
      wrongReceipt.correctionRecordIds[0]);
    assert.equal(Object.hasOwn(wrong.correction, "id"), false);
    assert.equal(corrected.transition.postDecisionSemanticId, null);
    assert.equal(corrected.transition.storyOutcomeId, null);
    assert.equal(corrected.transition.meaningSemanticId, null);
    assert.equal(isConnectedTextPresentationTransition(corrected.transition), true);
    assert.equal(Object.hasOwn(corrected.transition, "correct"), false);

    const correctionCheckpoint = JSON.parse(JSON.stringify(
      checkpointConnectedTextPresentation(corrected.nextPresentation)
    ));
    const rehydratedCorrection = rehydrateConnectedTextPresentation(
      restoredWrongState, correctionCheckpoint
    );
    assert.equal(isConnectedTextPresentationTransition(corrected.transition), false);
    assert.equal(isConnectedTextPresentationTransition(rehydratedCorrection.transition), true);

    challenge = scene.choice.kind === "assessed_connected_text"
      ? createConnectedTextChallenge(restoredWrongState, {
          transactionId, routeSeed: "task3-presentation-route"
        })
      : materializeBossTransferChallenge(restoredWrongState, { transactionId });
    const completed = completeStoryTransferTransaction(restoredWrongState, {
      transactionId,
      challenge,
      response: { kind: "literacy-answer", token: challenge.expectedToken },
      audio: { status: "completed" },
      at: new Date(Date.UTC(2026, 8, 2, 2, expedition.stopIndex, 0)).toISOString(),
      sessionDay: "2026-09-02"
    });
    assert.equal(completed.completed, true);
    const restoredCompletedState = normalizeSoundSeekersState(
      JSON.parse(JSON.stringify(completed.nextState))
    );
    const committed = reduceConnectedTextPresentation(rehydratedCorrection.presentation, {
      type: "decision_committed",
      reducerRevision: rehydratedCorrection.presentation.reducerRevision,
      evidenceEventId: completed.event.id
    }, { state: restoredCompletedState });
    assert.equal(committed.transition.phase, "action");

    const actionCheckpoint = JSON.parse(JSON.stringify(
      checkpointConnectedTextPresentation(committed.nextPresentation)
    ));
    const rehydrated = rehydrateConnectedTextPresentation(
      restoredCompletedState, actionCheckpoint
    );
    assert.equal(isConnectedTextPresentationTransition(committed.transition), false);
    assert.equal(isConnectedTextPresentationTransition(rehydrated.transition), true);
    const resolved = reduceConnectedTextPresentation(rehydrated.presentation, {
      type: "action_completed", reducerRevision: rehydrated.presentation.reducerRevision
    }, { state: restoredCompletedState });
    assert.equal(resolved.transition.phase, "resolved");
    const resolvedCheckpoint = checkpointConnectedTextPresentation(resolved.nextPresentation);
    const post = resolveSceneVisualSemantic(resolved.transition.postDecisionSemanticId);
    for (const meaningSemanticId of post.meaningSemanticIds) {
      const currentResolved = rehydrateConnectedTextPresentation(
        restoredCompletedState, JSON.parse(JSON.stringify(resolvedCheckpoint))
      );
      const meaning = reduceConnectedTextPresentation(currentResolved.presentation, {
        type: "meaning_requested",
        reducerRevision: currentResolved.presentation.reducerRevision,
        meaningSemanticId
      }, { state: restoredCompletedState });
      assert.equal(meaning.transition.phase, "meaning_support");
      assert.equal(meaning.transition.meaningSemanticId, meaningSemanticId);
      const resumedMeaning = rehydrateConnectedTextPresentation(
        restoredCompletedState,
        JSON.parse(JSON.stringify(checkpointConnectedTextPresentation(meaning.nextPresentation)))
      );
      assert.equal(isConnectedTextPresentationTransition(meaning.transition), false);
      assert.equal(isConnectedTextPresentationTransition(resumedMeaning.transition), true);
    }
    state = restoredCompletedState;
  }
  assert.equal(validContentDeckUses(state, "stories").length, 40);
  assert.equal(validContentDeckUses(state, "transfer").length, 40);
  assert.equal(state.evidence.filter(event => event.domain === "connected_text_transfer").length, 64);
  assert.equal(state.evidence.filter(event => event.domain === "novel_decoding").length, 16);
  const finalEventIds = new Set(validContentDeckUses(state, "stories")
    .map(use => use.evidenceEventId));
  assert.equal([...finalEventIds].filter(id => state.evidence.find(event =>
    event.id === id && event.domain === "connected_text_transfer")).length, 32);
  assert.equal([...finalEventIds].filter(id => state.evidence.find(event =>
    event.id === id && event.domain === "novel_decoding")).length, 8);
});

test("every boss option has a distinct non-assessed outcome that survives state and presentation reload", () => {
  const bossScenes = SOUND_SEEKERS_CONNECTED_TEXT
    .filter(scene => scene.choice.kind === "narrative_bridge");
  assert.equal(SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.length, 16);
  for (const scene of bossScenes) {
    const observed = [];
    for (const option of scene.choice.options) {
      const branch = resolveNarrativeBranchOutcome(scene.id, option.token);
      const fixture = completeBossBranchPresentationFixture(scene.id, option.token);
      const storyUse = validContentDeckUses(fixture.state, "stories")
        .find(use => use.transactionId === fixture.transactionId);
      const transferUse = validContentDeckUses(fixture.state, "transfer")
        .find(use => use.transactionId === fixture.transactionId);
      assert.equal(storyUse.narrativeChoiceToken, option.token);
      assert.equal(transferUse.narrativeChoiceToken, option.token);
      assert.equal(fixture.state.evidence
        .filter(event => event.domain === "novel_decoding").length, 1);
      assert.equal(fixture.state.evidence
        .filter(event => event.domain === "connected_text_transfer").length, 0);
      assert.equal(fixture.actionTransition.storyOutcomeId, branch.storyOutcomeId);
      assert.equal(
        fixture.actionTransition.postDecisionSemanticId,
        branch.postDecisionSemanticId
      );

      const savedState = normalizeSoundSeekersState(
        JSON.parse(JSON.stringify(fixture.state))
      );
      const savedPresentation = JSON.parse(JSON.stringify(
        checkpointConnectedTextPresentation(fixture.actionPresentation)
      ));
      const resumed = rehydrateConnectedTextPresentation(savedState, savedPresentation);
      assert.equal(resumed.transition.storyOutcomeId, branch.storyOutcomeId);
      assert.equal(resumed.transition.postDecisionSemanticId, branch.postDecisionSemanticId);
      assert.equal(resumed.presentation.history.some(event =>
        Object.hasOwn(event, "narrativeChoiceToken")
        || Object.hasOwn(event, "storyOutcomeId")
        || Object.hasOwn(event, "postDecisionSemanticId")), false);
      observed.push({
        storyOutcomeId: resumed.transition.storyOutcomeId,
        postDecisionSemanticId: resumed.transition.postDecisionSemanticId
      });
      closeConnectedTextPresentation(resumed.presentation);
    }
    assert.equal(new Set(observed.map(item => item.storyOutcomeId)).size, 2);
    assert.equal(new Set(observed.map(item => item.postDecisionSemanticId)).size, 2);
  }
});

test("two and three misses rehydrate while pending and after a later correct attempt", () => {
  for (const missCount of [2, 3]) {
    const run = beginCanonicalPresentationRetryFixture("scene-s1");
    let lastWrong = null;
    for (let ordinal = 0; ordinal < missCount; ordinal += 1) {
      const wrong = run.submitCurrentCanonicalWrong({ ordinal });
      const restoredWrongState = normalizeSoundSeekersState(
        JSON.parse(JSON.stringify(wrong.nextState))
      );
      const correction = reduceConnectedTextPresentation(run.presentation, {
        type: "decision_committed",
        reducerRevision: run.presentation.reducerRevision,
        evidenceEventId: wrong.event.id
      }, { state: restoredWrongState });
      assert.equal(correction.transition.phase, "correction");
      assert.equal(correction.transition.correctionRecordId,
        wrong.correction.correctionRecordId);
      assert.equal(correction.transition.postDecisionSemanticId, null);
      assert.equal(correction.transition.storyOutcomeId, null);
      assert.equal(correction.transition.meaningSemanticId, null);
      assert.equal(isConnectedTextPresentationTransition(correction.transition), true);
      const receipt = validAttemptReceipts(restoredWrongState)
        .find(item => item.eventIds.includes(wrong.event.id));
      assert.ok(receipt);
      assert.equal(receipt.completed, false);
      assert.deepEqual(receipt.correctionRecordIds,
        [wrong.correction.correctionRecordId]);
      assert.deepEqual(receipt.useIds, []);
      assert.equal(validContentDeckUses(restoredWrongState, "stories").length, 0);
      assert.equal(validContentDeckUses(restoredWrongState, "transfer").length, 0);
      run.acceptTask2AndPresentation(restoredWrongState, correction.nextPresentation);
      lastWrong = wrong;
    }

    if (missCount === 3) {
      assert.equal(run.state.checkpoint.storyTransfer.stage, "model_pending");
      assert.equal(lastWrong.outcome, "model_required");
      const modelPendingCheckpoint = JSON.parse(JSON.stringify(
        checkpointConnectedTextPresentation(run.presentation)
      ));
      const restoredModelPendingState = normalizeSoundSeekersState(
        JSON.parse(JSON.stringify(run.state))
      );
      const modelPendingResume = rehydrateConnectedTextPresentation(
        restoredModelPendingState, modelPendingCheckpoint
      );
      assert.equal(modelPendingResume.presentation.phase, "correction");
      assert.equal(modelPendingResume.transition.postDecisionSemanticId, null);
      const beforeModel = {
        evidence: restoredModelPendingState.evidence.length,
        receipts: validAttemptReceipts(restoredModelPendingState).length,
        storyUses: validContentDeckUses(restoredModelPendingState, "stories").length,
        transferUses: validContentDeckUses(restoredModelPendingState, "transfer").length,
        attemptId: restoredModelPendingState.checkpoint.storyTransfer.attemptId
      };
      const modeled = completeStoryTransferCorrectionModel(restoredModelPendingState, {
        transactionId: restoredModelPendingState.checkpoint.storyTransfer.transactionId
      });
      assert.equal(modeled.nextState.checkpoint.storyTransfer.stage, "response_pending");
      assert.equal(modeled.attempt.attemptId, beforeModel.attemptId);
      assert.equal(modeled.attempt.supportLevel, 3);
      assert.equal(modeled.attempt.revealed, true);
      assert.deepEqual({
        evidence: modeled.nextState.evidence.length,
        receipts: validAttemptReceipts(modeled.nextState).length,
        storyUses: validContentDeckUses(modeled.nextState, "stories").length,
        transferUses: validContentDeckUses(modeled.nextState, "transfer").length
      }, {
        evidence: beforeModel.evidence,
        receipts: beforeModel.receipts,
        storyUses: beforeModel.storyUses,
        transferUses: beforeModel.transferUses
      });
      const restoredModeledState = normalizeSoundSeekersState(
        JSON.parse(JSON.stringify(modeled.nextState))
      );
      const modeledResume = rehydrateConnectedTextPresentation(
        restoredModeledState, modelPendingCheckpoint
      );
      assert.equal(isConnectedTextPresentationTransition(modelPendingResume.transition), false);
      assert.equal(modeledResume.presentation.phase, "correction");
      run.acceptTask2AndPresentation(restoredModeledState, modeledResume.presentation);
    }

    const pendingCheckpoint = JSON.parse(JSON.stringify(
      checkpointConnectedTextPresentation(run.presentation)
    ));
    const restoredPendingState = normalizeSoundSeekersState(
      JSON.parse(JSON.stringify(run.state))
    );
    const pendingResume = rehydrateConnectedTextPresentation(
      restoredPendingState, pendingCheckpoint
    );
    assert.equal(pendingResume.presentation.phase, "correction");
    assert.equal(pendingResume.presentation.history
      .filter(event => event.type === "decision_committed").length, missCount);
    assert.equal(isConnectedTextPresentationTransition(pendingResume.transition), true);
    run.acceptTask2AndPresentation(restoredPendingState, pendingResume.presentation);

    const completed = run.submitCurrentCanonicalCorrect({ ordinal: missCount });
    const restoredCompletedState = normalizeSoundSeekersState(
      JSON.parse(JSON.stringify(completed.nextState))
    );
    const action = reduceConnectedTextPresentation(run.presentation, {
      type: "decision_committed",
      reducerRevision: run.presentation.reducerRevision,
      evidenceEventId: completed.event.id
    }, { state: restoredCompletedState });
    assert.equal(action.transition.phase, "action");
    assert.equal(action.nextPresentation.history
      .filter(event => event.type === "decision_committed").length, missCount + 1);
    const completedCheckpoint = JSON.parse(JSON.stringify(
      checkpointConnectedTextPresentation(action.nextPresentation)
    ));
    const completedResume = rehydrateConnectedTextPresentation(
      restoredCompletedState, completedCheckpoint
    );
    assert.equal(completedResume.presentation.phase, "action");
    assert.equal(completedResume.presentation.history
      .filter(event => event.type === "decision_committed").length, missCount + 1);
    assert.equal(isConnectedTextPresentationTransition(action.transition), false);
    assert.equal(isConnectedTextPresentationTransition(completedResume.transition), true);
    assertWholeDecisionHistoryMatchesContiguousAttemptReceipts(
      restoredCompletedState, completedResume.presentation.history, missCount + 1
    );
  }
});

test("only the exact active revision survives advance, replacement, or close", () => {
  const fixture = completeCanonicalPresentationFixture("scene-s1");
  const actionState = fixture.nextPresentation;
  const actionTransition = fixture.transition;
  const resolved = reduceConnectedTextPresentation(actionState, {
    type: "action_completed", reducerRevision: actionState.reducerRevision
  }, { state: fixture.state });
  assert.equal(isConnectedTextPresentationTransition(actionTransition), false);
  assert.equal(isConnectedTextPresentationTransition(resolved.transition), true);
  assert.throws(() => checkpointConnectedTextPresentation(actionState));
  assert.throws(() => reduceConnectedTextPresentation(actionState, {
    type: "action_completed", reducerRevision: actionState.reducerRevision
  }, { state: fixture.state }));

  const replacement = beginConnectedTextPresentation({
    sceneId: "scene-s2", transactionId: "replacement:scene-s2"
  });
  assert.equal(isConnectedTextPresentationTransition(resolved.transition), false);
  assert.throws(() => checkpointConnectedTextPresentation(resolved.nextPresentation));
  assert.equal(closeConnectedTextPresentation(replacement), true);
  assert.throws(() => checkpointConnectedTextPresentation(replacement));
  assert.throws(() => closeConnectedTextPresentation(replacement));
});

test("presentation brands, canonical identity, phase order, meaning, and resume fail closed", () => {
  const fixture = completeCanonicalPresentationFixture("scene-s1");
  const { presentation, state, decisionEvent, transition } = fixture;
  for (const forged of [
    { ...presentation }, Object.freeze({ ...presentation }), structuredClone(presentation),
    JSON.parse(JSON.stringify(presentation))
  ]) {
    assert.throws(() => reduceConnectedTextPresentation(forged, decisionEvent, { state }));
  }
  for (const forged of [
    { ...transition }, Object.freeze({ ...transition }), structuredClone(transition),
    JSON.parse(JSON.stringify(transition))
  ]) {
    assert.equal(isConnectedTextPresentationTransition(forged), false);
    assert.throws(() => projectConnectedTextPresentationTransition(forged));
  }
  assertPresentationIdentityMutationsFail(fixture, [
    "sceneId", "transactionId", "attemptId", "evidenceEventId", "reducerRevision"
  ]);
  assert.throws(() => reduceConnectedTextPresentation(fixture.nextPresentation, {
    type: "meaning_requested", reducerRevision: fixture.nextPresentation.reducerRevision,
    meaningSemanticId: "meaning-mat-flat-ground-cover"
  }, { state }));
  const resolved = reduceConnectedTextPresentation(fixture.nextPresentation, {
    type: "action_completed", reducerRevision: fixture.nextPresentation.reducerRevision
  }, { state });
  assert.throws(() => reduceConnectedTextPresentation(resolved.nextPresentation, {
    type: "meaning_requested", reducerRevision: resolved.nextPresentation.reducerRevision,
    meaningSemanticId: "meaning-box-container"
  }, { state }));
  const checkpoint = checkpointConnectedTextPresentation(resolved.nextPresentation);
  assertStrictCheckpointMutationsFail(state, checkpoint);
  const resumed = rehydrateConnectedTextPresentation(state, JSON.parse(JSON.stringify(checkpoint)));
  assert.equal(isConnectedTextPresentationTransition(resolved.transition), false);
  assert.equal(isConnectedTextPresentationTransition(resumed.transition), true);
});

test("source and child options have one non-inferential shape while evaluators stay private", () => {
  const childOptionFields = [
    "token", "presentation", "childLabel", "accessibleLabel", "visualSemanticId"
  ];
  const childSceneFields = [
    "chapterId", "choice", "id", "level", "preChoiceSemanticId", "prompt", "residentId", "stopId",
    "text", "textAudioKey", "visualSemanticId"
  ];
  const forbiddenChildFields = new Set([
    "storyRef", "transferRef", "problemId", "consequencePreviewId", "repairId",
    "relationshipBeatId", "consequenceId", "narrativeBranches", "storyOutcomeId",
    "tokenIds", "heartWordIds", "advancedTokenIds",
    "advancedTokenAudit", "advancedTokenAuditDecision", "expectedToken",
    "forbiddenPromptTokens", "misconceptionByToken", "correctionByToken", "rationaleByToken",
    "evidence", "postDecisionSemanticId", "postDecisionSemanticIds", "answerIndex", "answerKey", "correct", "correctness",
    "feedback", "isCorrect", "isKey", "keyIndex", "score"
  ]);
  const allObjectKeys = value => Array.isArray(value)
    ? value.flatMap(allObjectKeys)
    : value && typeof value === "object"
      ? [...Object.keys(value), ...Object.values(value).flatMap(allObjectKeys)]
      : [];
  const forbiddenEvaluatorProperty = /"(?:answerIndex|answerKey|correct|correctness|correctionByToken|distractorRationale|evidence|expectedToken|feedback|forbiddenPromptTokens|isCorrect|isKey|keyIndex|misconceptionByToken|rationaleByToken|score)"\s*:/u;
  assert.doesNotMatch(JSON.stringify(CONNECTED_TEXT_RECORDS), forbiddenEvaluatorProperty);

  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const expectedOptionCount = scene.choice.kind === "assessed_connected_text" ? 3 : 2;
    assert.equal(scene.choice.options.length, expectedOptionCount, scene.id);
    for (const option of scene.choice.options) {
      assert.deepEqual(Object.keys(option), childOptionFields);
      assert.deepEqual(
        childOptionFields.map(field => typeof option[field]),
        ["string", "string", "string", "string", "string"]
      );
    }
    if (scene.choice.kind === "narrative_bridge") {
      assert.equal(scene.narrativeBranches.length, 2);
      assert.deepEqual(scene.narrativeBranches.map(branch => branch.token).sort(),
        scene.choice.options.map(option => option.token).sort());
      assert.equal(new Set(scene.narrativeBranches.map(branch => branch.storyOutcomeId)).size, 2);
      assert.equal(new Set(scene.narrativeBranches
        .map(branch => branch.postDecisionSemanticId)).size, 2);
      for (const branch of scene.narrativeBranches) {
        assert.deepEqual(Object.keys(branch), [
          "token", "storyOutcomeId", "postDecisionSemanticId"
        ]);
        assert.strictEqual(resolveNarrativeBranchOutcome(scene.id, branch.token),
          SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.find(item =>
            item.sceneId === scene.id && item.token === branch.token));
      }
    } else {
      assert.deepEqual(scene.narrativeBranches, []);
    }
    for (const routeSeed of ["route-a", "route-b"]) {
      const child = toChildConnectedTextScene(scene.id, routeSeed);
      assert.doesNotMatch(JSON.stringify(child), forbiddenEvaluatorProperty);
      assert.deepEqual(Object.keys(child).sort(), childSceneFields);
      assert.deepEqual(Object.keys(child.prompt).sort(), ["audioKey", "text"]);
      assert.deepEqual(Object.keys(child.choice).sort(), ["kind", "options"]);
      assert.equal(child.preChoiceSemanticId, getSceneVisualSemantics(scene.id).preChoiceSemanticId);
      assert.equal(child.choice.options.length, expectedOptionCount, scene.id);
      assert.deepEqual(
        allObjectKeys(child).filter(key => forbiddenChildFields.has(key)),
        []
      );
      for (const option of child.choice.options) {
        assert.deepEqual(Object.keys(option), childOptionFields);
        assert.deepEqual(
          childOptionFields.map(field => typeof option[field]),
          ["string", "string", "string", "string", "string"]
        );
      }
    }

    const evaluator = CONNECTED_TEXT_EVALUATORS[scene.id];
    if (scene.choice.kind === "narrative_bridge") {
      assert.equal(evaluator, undefined);
      continue;
    }
    const tokens = scene.choice.options.map(option => option.token).sort();
    const nonKeyTokens = tokens.filter(token => token !== evaluator.expectedToken);
    assert.equal(nonKeyTokens.length, 2, scene.id);
    assert.deepEqual(Object.keys(evaluator).sort(), [
      "correctionByToken", "evidence", "expectedToken", "forbiddenPromptTokens",
      "misconceptionByToken", "rationaleByToken"
    ]);
    assert.ok(tokens.includes(evaluator.expectedToken));
    assert.deepEqual(Object.keys(evaluator.misconceptionByToken).sort(), nonKeyTokens);
    assert.deepEqual(Object.keys(evaluator.correctionByToken).sort(), nonKeyTokens);
    assert.deepEqual(Object.keys(evaluator.rationaleByToken).sort(), tokens);
    for (const map of [
      evaluator.misconceptionByToken,
      evaluator.correctionByToken,
      evaluator.rationaleByToken
    ]) {
      assert.ok(Object.values(map).every(value => typeof value === "string" && value.trim().length > 0));
    }
  }
});

test("the repository-wide production graph has one narrow connected-text boundary", () => {
  const roots = ["src", "preview"];
  const sourceFilesBelow = root => {
    if (!existsSync(root)) return [];
    return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) return sourceFilesBelow(path);
      return /\.(?:js|jsx|mjs)$/u.test(entry.name) ? [path] : [];
    });
  };
  const files = roots.flatMap(sourceFilesBelow).map(path => path.replaceAll("\\", "/"));
  const knownConsumers = [
    "src/features/soundSeekers/runtime", "src/features/soundSeekers/ui",
    "src/features/soundSeekers/visual", "src/features/soundSeekers/SoundSeekersGame.jsx",
    "src/features/soundSeekers/SoundSeekersRoute.jsx", "src/quest-preview.jsx", "preview",
    "src/features/soundSeekers/preview/galleryReplayRecipes.js",
    "src/features/soundSeekers/preview/ContentArtGallery.jsx"
  ];
  for (const consumer of knownConsumers) {
    if (!existsSync(consumer)) continue;
    const isFile = /\.(?:js|jsx|mjs)$/u.test(consumer);
    assert.equal(isFile
      ? files.includes(consumer)
      : files.some(path => path === consumer || path.startsWith(`${consumer}/`)), true, consumer);
  }

  const exactNamedImports = new Map([
    ["src/features/soundSeekers/content/connectedText.js", new Map([
      ["./connectedTextRecords.js", ["CONNECTED_TEXT_RECORDS"]],
      ["./connectedTextAnswerKeys.js", ["CONNECTED_TEXT_DECISION_FEEDBACK"]]
    ])],
    ["src/features/soundSeekers/content/sceneVisualSemantics.js", new Map([
      ["./connectedTextRecords.js", ["CONNECTED_TEXT_RECORDS"]]
    ])],
    ["src/features/soundSeekers/engine/connectedTextPresentation.js", new Map([
      ["../content/connectedText.js", ["evaluateConnectedTextDecision", "getConnectedText"]]
    ])],
    ["src/features/soundSeekers/engine/createChallenge.js", new Map([
      ["../content/connectedText.js", ["createConnectedTextChallenge", "toChildConnectedTextScene"]]
    ])],
    ["src/features/soundSeekers/engine/sceneVisualAccess.js", new Map([
      ["./connectedTextPresentation.js", [
        "isConnectedTextPresentationTransition", "projectConnectedTextPresentationTransition"
      ]]
    ])],
    ["src/features/soundSeekers/engine/missionReducer.js", new Map([
      ["./connectedTextPresentation.js", [
        "beginConnectedTextPresentation", "checkpointConnectedTextPresentation",
        "closeConnectedTextPresentation", "reduceConnectedTextPresentation",
        "rehydrateConnectedTextPresentation"
      ]]
    ])],
    ["src/features/soundSeekers/preview/galleryReplayRecipes.js", new Map([
      ["../content/connectedText.js", [
        "createConnectedTextChallenge", "toChildConnectedTextScene"
      ]],
      ["../engine/connectedTextPresentation.js", [
        "beginConnectedTextPresentation", "checkpointConnectedTextPresentation",
        "closeConnectedTextPresentation", "reduceConnectedTextPresentation",
        "rehydrateConnectedTextPresentation"
      ]]
    ])]
  ]);
  const boundaryModules = new Set([
    "connectedTextRecords.js", "connectedTextAnswerKeys.js", "connectedText.js",
    "connectedTextPresentation.js"
  ]);
  for (const path of files) {
    for (const edge of parseModuleEdges(readFileSync(path, "utf8"))) {
      if (edge.kind === "dynamic_import"
        && (!edge.literal || boundaryModules.has(edge.specifier?.split("/").at(-1)))) {
        assert.fail(`${path} has an unverifiable or forbidden connected-text dynamic import`);
      }
      if (!edge.literal || !boundaryModules.has(edge.specifier.split("/").at(-1))) continue;
      assert.equal(edge.kind, "static_import",
        `${path} may not re-export or dynamically import ${edge.specifier}`);
      const permitted = exactNamedImports.get(path)?.get(edge.specifier);
      assert.ok(permitted, `${path} may not import ${edge.specifier}`);
      assert.deepEqual([...edge.named].sort(), [...permitted].sort(), path);
      assert.equal(edge.defaultName, null, path);
      assert.equal(edge.namespaceName, null, path);
    }
  }
  for (const [path, imports] of exactNamedImports) {
    if (!existsSync(path)) continue;
    const parsed = parseModuleEdges(readFileSync(path, "utf8"))
      .filter(edge => edge.kind === "static_import");
    for (const [specifier, names] of imports) {
      assert.deepEqual(parsed.find(item => item.specifier === specifier)?.named.sort(), [...names].sort());
    }
  }
  for (const path of files.filter(path => /(?:index|barrel)\.(?:js|jsx|mjs)$/u.test(path))) {
    assert.equal(parseModuleEdges(readFileSync(path, "utf8")).some(edge =>
      edge.literal && boundaryModules.has(edge.specifier.split("/").at(-1))), false, path);
  }
});

test("tokenization and readability bands are deterministic and stop truthful", () => {
  assert.deepEqual(tokenizeConnectedText("A mat. A mat!"), ["a", "mat", "a", "mat"]);
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    assert.deepEqual(validateSceneAtStop(scene, scene.stopId), []);
    assert.equal(scene.level, readabilityBandForStop(Number(scene.stopId.slice(1))).level);
    assertExactOrderedTokenResolution(scene);
    assertPromptAndEveryVisibleChildLabelFitBands(scene);
    assertEveryVisibleChildLabelIsReadableAtStop(scene);
    assertAccessibleLabelsAreSemanticAudioOnly(scene);
    assertAdvancedTokenAuditIsComplete(scene);
  }
});

test("the current word actions derive forty-eight uses and the exact forty-six-word meaning set", () => {
  const derived = [...new Set(SOUND_SEEKERS_EXPEDITIONS
    .flatMap(expedition => expedition.phases)
    .filter(phase => ["word_forge", "blend_bridge"].includes(phase.powerId) && phase.wordId)
    .map(phase => phase.wordId))].sort();
  const uses = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases)
    .filter(phase => ["word_forge", "blend_bridge"].includes(phase.powerId) && phase.wordId);
  assert.equal(uses.length, 48);
  assert.deepEqual(derived, REQUIRED_ACTION_MEANING_WORD_IDS);
  assert.deepEqual(REQUIRED_ACTION_MEANING_WORD_IDS, [
    "action", "bike", "bird", "boat", "book", "box", "bun", "by", "cake", "car", "cat", "cats",
    "chair", "city", "clap", "coin", "cube", "cup", "fiction", "frog", "hand", "hear", "home", "hot",
    "jam", "light", "little", "mat", "moon", "near", "night", "point", "pure", "rain", "rock", "ship",
    "sit", "sound", "spin", "stone", "storm", "theme", "thin", "thing", "tree", "truck"
  ]);
  assertMeaningSupportExactlyCovers([
    ...REQUIRED_ACTION_MEANING_WORD_IDS,
    ...SOUND_SEEKERS_CONNECTED_TEXT.flatMap(scene => scene.advancedTokenIds)
  ]);
  const advanced = [...new Set(SOUND_SEEKERS_CONNECTED_TEXT
    .flatMap(scene => scene.advancedTokenIds))].sort();
  assert.deepEqual(ADVANCED_SCENE_TOKEN_IDS, advanced);
  assert.equal(ADVANCED_SCENE_TOKEN_COUNT, advanced.length);
  assertGeneratedAdvancedTokenHash(ADVANCED_SCENE_TOKEN_CONTENT_HASH, advanced);
});

test("neutral scene, 112 peer options, post-decision results, and meanings form one pure registry", () => {
  assert.equal(Object.isFrozen(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY), true);
  assert.equal(SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.length, 40);
  assert.equal(SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS.length, 40);
  assert.equal(SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS.length, (32 * 3) + (8 * 2));
  assert.equal(SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS.length, 32 + (8 * 2));
  assert.equal(SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.length, 8 * 2);
  assert.equal(SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.length, SOUND_SEEKERS_MEANING_SUPPORT.length);
  assert.equal(
    SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.length,
    40 + 40 + ((32 * 3) + (8 * 2)) + (32 + (8 * 2))
      + SOUND_SEEKERS_MEANING_SUPPORT.length
  );
  assert.equal(
    new Set(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.map(item => item.id)).size,
    SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.length
  );
  for (const record of SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY) {
    assert.equal(resolveSceneVisualSemantic(record.id), record);
  }
  assert.deepEqual(
    SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.map(item => item.id).sort(),
    SOUND_SEEKERS_MEANING_SUPPORT.map(item => item.visualSemanticId).sort()
  );
  assert.deepEqual(
    SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS
      .map(({ id, wordId }) => ({ id, wordId }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    MEANING_SUPPORT_RECORDS
      .map(({ visualSemanticId: id, wordId }) => ({ id, wordId }))
      .sort((a, b) => a.id.localeCompare(b.id))
  );
  const referencedMeaningIds = [...new Set(SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS
    .flatMap(item => item.meaningSemanticIds))].sort();
  const completeMeaningIds = SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS
    .map(item => item.id).sort();
  assert.deepEqual(referencedMeaningIds, completeMeaningIds);
  const orderedPostDecisions = [...SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS]
    .sort((a, b) => Number(a.sceneId.slice(7)) - Number(b.sceneId.slice(7)))
    .flatMap(scene => scene.postDecisionSemanticIds.map(resolveSceneVisualSemantic));
  const expectedOwners = completeMeaningIds.map(meaningSemanticId => {
    const owner = orderedPostDecisions
      .find(item => item.meaningSemanticIds.includes(meaningSemanticId));
    return {
      meaningSemanticId,
      sceneId: owner.sceneId,
      postDecisionSemanticId: owner.id
    };
  });
  assert.deepEqual(SOUND_SEEKERS_MEANING_VISUAL_OWNERS, expectedOwners);
  assert.equal(new Set(SOUND_SEEKERS_MEANING_VISUAL_OWNERS
    .map(item => item.meaningSemanticId)).size, completeMeaningIds.length);

  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const visual = getSceneVisualSemantics(scene.id);
    assert.deepEqual(Object.keys(visual).sort(), [
      "answerNeutralBeforeChoice", "chapterId", "id", "kind", "optionSemanticIds",
      "postDecisionSemanticIds", "preChoiceSemanticId", "sceneId"
    ]);
    assert.equal(visual.id, scene.visualSemanticId);
    assert.equal(visual.sceneId, scene.id);
    assert.deepEqual(visual.optionSemanticIds, scene.choice.options.map(option => option.visualSemanticId));

    const preChoice = resolveSceneVisualSemantic(visual.preChoiceSemanticId);
    const postDecisions = visual.postDecisionSemanticIds.map(resolveSceneVisualSemantic);
    assert.equal(postDecisions.length, scene.choice.kind === "narrative_bridge" ? 2 : 1);
    assert.deepEqual(Object.keys(preChoice).sort(), [
      "answerNeutral", "chapterId", "characterIds", "id", "kind", "neutralPropIds",
      "neutralStateId", "sceneId", "settingId"
    ]);
    for (const postDecision of postDecisions) assert.deepEqual(Object.keys(postDecision).sort(), [
      "actionStateId", "chapterId", "consequenceId", "id", "kind", "meaningSemanticIds",
      "resolvedStateId", "sceneId", "storyOutcomeId"
    ]);
    assert.equal(preChoice.kind, "pre_choice");
    assert.equal(preChoice.answerNeutral, true);
    for (const postDecision of postDecisions) {
      assert.equal(postDecision.kind, "post_decision");
      if (scene.choice.kind === "assessed_connected_text") {
        assert.equal(postDecision.storyOutcomeId, null);
        assert.equal(postDecision.consequenceId, scene.consequenceId);
      } else {
        const branch = scene.narrativeBranches.find(item =>
          item.postDecisionSemanticId === postDecision.id);
        assert.ok(branch);
        assert.equal(postDecision.storyOutcomeId, branch.storyOutcomeId);
      }
    }
    if (scene.choice.kind === "narrative_bridge") {
      assert.deepEqual(visual.postDecisionSemanticIds,
        scene.narrativeBranches.map(branch => branch.postDecisionSemanticId));
      assert.equal(new Set(postDecisions.map(post => JSON.stringify({
        actionStateId: post.actionStateId,
        resolvedStateId: post.resolvedStateId,
        consequenceId: post.consequenceId
      }))).size, 2);
    }

    const optionVisuals = scene.choice.options.map(option => {
      const record = resolveSceneVisualSemantic(option.visualSemanticId);
      assert.equal(record.kind, "option");
      assert.equal(record.sceneId, scene.id);
      assert.equal(record.salienceTier, "equal_choice");
      assert.deepEqual(Object.keys(record).sort(), [
        "accessibleLabel", "actionSemanticId", "chapterId", "childLabel", "comparisonFamilyId",
        "frameSemanticId", "id", "kind", "propSemanticIds", "salienceTier", "sceneId"
      ]);
      assert.equal(record.childLabel, option.childLabel);
      assert.equal(record.accessibleLabel, option.accessibleLabel);
      return record;
    });
    assert.equal(new Set(optionVisuals.map(record => record.frameSemanticId)).size, 1);
    assert.equal(new Set(optionVisuals.map(record => record.salienceTier)).size, 1);

    const preChoiceIds = new Set([
      preChoice.settingId,
      ...preChoice.characterIds,
      ...preChoice.neutralPropIds,
      preChoice.neutralStateId
    ]);
    const forbiddenBeforeChoice = new Set([
      ...optionVisuals.flatMap(record => [...record.propSemanticIds, record.actionSemanticId]),
      ...postDecisions.flatMap(postDecision => [
        postDecision.actionStateId,
        postDecision.resolvedStateId,
        postDecision.consequenceId,
        ...postDecision.meaningSemanticIds
      ])
    ]);
    assert.deepEqual([...preChoiceIds].filter(id => forbiddenBeforeChoice.has(id)), []);

    const child = toChildConnectedTextScene(scene.id, "route-a");
    for (const postDecisionSemanticId of visual.postDecisionSemanticIds) {
      assert.equal(JSON.stringify(child).includes(postDecisionSemanticId), false);
    }
    for (const meaningSemanticId of new Set(postDecisions
      .flatMap(postDecision => postDecision.meaningSemanticIds))) {
      assert.equal(JSON.stringify(child).includes(meaningSemanticId), false);
      const meaningVisual = resolveSceneVisualSemantic(meaningSemanticId);
      const support = SOUND_SEEKERS_MEANING_SUPPORT.find(item => item.visualSemanticId === meaningSemanticId);
      assert.deepEqual(Object.keys(meaningVisual).sort(), ["id", "kind", "wordId"]);
      assert.equal(meaningVisual.kind, "meaning");
      assert.equal(meaningVisual.wordId, support.wordId);
    }
  }

  const registryText = JSON.stringify(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY);
  assert.doesNotMatch(registryText, /"(?:answerIndex|answerKey|correct|correctness|correction|expectedToken|feedback|isCorrect|isKey|keyIndex|misconception|rationale|score)"\s*:/u);
  assert.doesNotMatch(registryText, /(?:\.png|\.webp|\.svg|\/public\/|className|rendererKind)/iu);
});

test("eight arcs retain thirty-two identities and forty ordered durable beats", () => {
  assert.deepEqual(Object.keys(SOUND_SEEKERS_CAST_ARCS), SOUND_SEEKERS_CHAPTERS.map(chapter => chapter.id));
  assert.equal(new Set(Object.values(SOUND_SEEKERS_CAST_ARCS).flatMap(arc => arc.characters.map(item => item.id))).size, 32);
  assert.equal(Object.values(SOUND_SEEKERS_CAST_ARCS).flatMap(arc => arc.relationshipBeats).length, 40);
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const arc = SOUND_SEEKERS_CAST_ARCS[chapter.id];
    assertArcMatchesChapterAndExpeditions(arc, chapter);
    for (const beat of arc.relationshipBeats) {
      assert.strictEqual(getCastRelationshipBeat(beat.id), beat);
      assert.deepEqual(Object.keys(beat), [
        "id", "chapterId", "stopId", "residentId", "repairId", "consequenceId",
        "callbackRepairIds", "callbackLines"
      ]);
      assert.deepEqual(beat.callbackLines.map(line => line.repairId), beat.callbackRepairIds);
      assert.equal(new Set(beat.callbackRepairIds).size, beat.callbackRepairIds.length);
      for (const line of beat.callbackLines) {
        assert.deepEqual(Object.keys(line), ["repairId", "text"]);
        assert.ok(line.text.includes(concreteResultNameForRepair(line.repairId)));
      }
    }
    for (const character of arc.characters) {
      assert.deepEqual(Object.keys(character).sort(), ["archetype", "id", "role"]);
      assert.doesNotMatch(
        JSON.stringify(character),
        /bodyShape|feature|gear|palette|pose|prop|renderer|style|visual/iu
      );
    }
  }
});
```

The choice suite also mutates each fixture to reject: anything other than exactly three options/two non-key tokens for an assessed scene or exactly two options for a narrative scene; zero or two private evaluator records; an expected token absent from options; a missing, extra, null, empty, or generic private misconception/correction/rationale entry; private map keys that do not exactly match the keyed/non-keyed sets above; duplicate tokens/visual IDs; any evaluator field added to one source/child option; any null-vs-string, optional-field, key-order, or value-type discriminator between source/child option shapes; any extra or missing key in the exact child-scene, prompt, choice, or option projection; any reducer, catalog, outcome, audit/provenance, evidence, branch, or post-decision field in that projection; a renderer import of a raw record, evaluator, reducer challenge, evaluator function, branch resolver, or direct `getConnectedText()` result; a prompt/pre-choice semantic record containing a forbidden answer prop, action, result, consequence, branch outcome, or meaning ID; unequal option frame/salience; an option visual ID that does not resolve; a `correct`, `correctness`, `isCorrect`, `isKey`, `answerIndex`, `answerKey`, `keyIndex`, `expectedToken`, `feedback`, `score`, rationale, misconception, or correction property in child-safe or renderer-visible data; any rendered `childLabel`, including an image option's label, that outruns the stop-readable set; an accessible label rendered as visible text or lacking its semantic assistive-audio announcement path; fixed correct-position bias; a narrative choice with an evaluator or evidence domain; zero/one/three narrative branches, a branch token outside its two options, duplicate story outcomes/post-decision IDs, or a branch outcome that changes the boss answer; a connected-text challenge carrying boss/word/activity identity; a connected-text event that does not preserve canonical word/position/boss nulls and absent non-heart `activityType`; or a real Task 3 challenge whose `{instructionId,powerId,expectedAction,recordsDomain}` tuple is rejected by the Task 2 composite reducer. It proves route-seeded option order is deterministic across resume but varies without changing tokens, the reducer key, or the canonical branch mapping, and that no source/child structural classifier can infer the keyed token from field presence, field type, nullability, option framing, or salience.

The audio suite mutates each of `codec`, `sampleRateHz`, `channels`, and `bitrateBps` independently to reject a missing field, wrong type, non-positive value, unsupported value, and a value that disagrees with the probed final MP3. It also runs the real shared manifest generator inside the isolated five-output fixture described in Step 5 and asserts the exact two-file changed set rather than merely checking that the desired two files exist.

- [ ] **Step 2: Run the Task 3 tests and confirm the precise red state**

Run:

```bash
node --test tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersConnectedTextPresentation.test.js tests/unit/soundSeekersConnectedTextGenerator.test.js tests/unit/soundSeekersMeaningSupport.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersSceneAudio.test.js
```

Expected: FAIL because the composite 40/40 joins, exact 32/8 decision split and per-scene 3/2 option counts, 16 distinct persistent narrative branches, wholly private evaluator maps, exact minimal child projection and renderer import boundary, all-40 real Task 2 transaction/presentation compatibility, branded transition/replay authority, canonical connected-text null/omission evidence, all-visible-label readability, separate usage ledger, 46-word support snapshot, advanced-token support, split 40/112/48/direct-meaning semantic visual registry, identity-only eight arcs with resolvable callback lines, and 80-plus-derived audio catalog do not exist. A failure caused by missing/uncommitted Task 1 or Task 2 exports is a dependency blocker, not permission to stub them in Task 3.

- [ ] **Step 3: Author all 40 composite scenes, private decisions, visual semantics, and cast arcs**

Write exactly five scenes per chapter. The levels and token/sentence counts follow the table above; do not relabel a long passage as a lower band. Each scene joins exactly one imported Task 2 story record and one imported Task 2 transfer record, and matches every Task 1 identity named in the interface. Reject a record that joins by array position while any ID differs.

The 32 non-boss scenes each ask one text-supported repair/action decision. Author exactly three stable child options in the one five-field shape: one reducer key plus two plausible distractors in the declared comparison family. Only the private evaluator names why each distractor is plausible, what misconception it diagnoses, what correction follows, and why the keyed response is supported. The raw scene, prompt, child projection, option order, accessible labels, and feedback-neutral pre-answer state may not reveal which token is keyed by metadata, nullability, field shape, framing, salience, or pre-choice art. The eight fifth-stop scenes contain an unscored narrative bridge; each of its two defensible options causes a different authored Story Power outcome and branch-specific world presentation, while the imported Task 1 boss remains the sole assessed transfer. Narrative branch persistence is gameplay state, never evidence or mastery.

`createConnectedTextChallenge()` obtains the object-identical Task 2 canonical challenge and verifies its exact transfer tuple, evidence identity, three opaque tokens, and private key against the validated scene/evaluator. The implementation is not accepted on foundation challenge validation alone. Retain the focused 32-scene assessed compatibility test, including an initial-submit mutation that makes a distractor the caller's expected token and proves Task 2 rejects it before evidence. Add the presentation suite's one-state all-40 wrong→reload→fresh-correct loop: 32 real Task 3 joined canonical challenges plus all eight challenges returned by Task 2 `materializeBossTransferChallenge()`. At each boss, take one real route-ordered Task 3 narrative token and write it to the Task 2 checkpoint; Task 3 later reads it only from the live checkpoint or equal final-use fields. Every wrong response immediately contributes one valid attempt receipt/evidence event to a branded Task 3 correction transition and zero uses/payoff; the third wrong remains presentable as correction while the Task 2 checkpoint is already `model_pending`, correction-model completion returns that same fresh attempt to `response_pending` with no event/receipt/use/presentation revision, and only the later fresh supported response may continue. The accumulated one-wrong state finishes with exactly 40 story uses, 40 transfer uses, 64 total connected-text events, 16 total novel-decoding events, and exactly 32/8 **final pair** event IDs. A separate two-option loop completes and reloads both branches of every boss, proving two distinct `storyOutcomeId`/post-decision pairs and no narrative evidence. Neither loop substitutes a mock reducer, raw use/event/receipt, caller-authored non-boss key, singleton boss challenge, fresh state per scene in the aggregate, retained narrative token, or caller correctness, so tuple omission, key drift, boss-context drift, retry/model drift, branch drift, or cross-scene immutable-ID collision fails before Task 3 can pass.

Implement `connectedTextPresentation.js` exactly as the branded exact-current revision and private whole-history contract above. The presentation test's `completeCanonicalPresentationFixture`, `beginCanonicalPresentationRetryFixture`, contiguous-receipt assertion, identity-mutation helper, and checkpoint-mutation helper are test-local functions defined in that test file. They execute the real Task 2 begin/checkpoint/materialize/complete/model flow, including two- and three-miss pending/model-pending/completed histories; none constructs an event, use, receipt, correction, transition, or answer key. The mutation helpers clone one field at a time and assert the named public APIs throw. They are not production shortcuts. A source-boundary test parses imports and requires `connectedTextPresentation.js` to import only the named Task 2 state/scheduler/catalog modules and Task 3 connected-text/meaning/semantic modules; it forbids Task 4, React, renderer, preview, asset, direct evidence-construction, dynamic-import, and public-barrel edges. A source scan rejects `kind:"connected_text_presentation_transition"` outside this module and rejects any exported WeakSet/WeakMap/generation/brand or correctness/selected-token-taking presentation API. The repository-wide production graph scan parses static imports, `export ... from`/`export * from`, literal and non-literal dynamic imports across all `src/**/*.{js,jsx,mjs}` plus `preview/**`, explicitly including Task 4 components, Task 6 gallery, runtime, UI, `SoundSeekersGame.jsx`, `SoundSeekersRoute.jsx`, `src/quest-preview.jsx`, and every public Sound Seekers barrel. Re-exporting or dynamically importing any boundary module is forbidden. Its exact named-static-import map permits private joins only in their owner module, child projection/challenge only in `createChallenge.js`, lifecycle reduction only in `missionReducer.js`, transition projection only in `sceneVisualAccess.js`, and the exact Task 6 `galleryReplayRecipes.js` imports shown in the test; no other preview edge is allowed. Task 6 reruns the scan after every downstream consumer exists. The all-40 loop requests, checkpoints, rehydrates, and revalidates every direct meaning semantic referenced by every scene, while the union/owner assertions prove that set is the complete meaning registry rather than a reachable subset.

`toChildConnectedTextScene()` constructs only the exact minimal projection above. It does not spread an authored scene and delete selected keys. The test recursively rejects private or outcome-bearing keys and scans current quest renderers plus the Task 4 visual and Task 6 preview roots whenever those roots exist; those consumers may name only `toChildConnectedTextScene()` from this boundary. Every displayed `childLabel`, including image-option copy, is validated against the stop-readable set. A richer `accessibleLabel` is semantic-only and receives the assistive-technology audio-announcement path; it is never painted as substitute visible text and never contributes evidence.

`sceneVisualSemantics.js` authors four separate kind-discriminated layers and one direct meaning namespace. A 40-record scene link contains IDs only:

```js
{
  id: "scene-s1-visual",
  kind: "scene",
  sceneId: "scene-s1",
  chapterId: "seedwake-meadow",
  preChoiceSemanticId: "scene-s1-pre-choice",
  optionSemanticIds: [
    "scene-s1-option-use-mat",
    "scene-s1-option-ring-bell",
    "scene-s1-option-lift-lantern"
  ],
  postDecisionSemanticIds: ["scene-s1-post-decision"],
  answerNeutralBeforeChoice: true
}
```

The corresponding pre-choice record is generic context only:

```js
{
  id: "scene-s1-pre-choice",
  kind: "pre_choice",
  sceneId: "scene-s1",
  chapterId: "seedwake-meadow",
  settingId: "seedwake-lantern-path",
  characterIds: ["Bouncy", "Moss"],
  neutralPropIds: ["meadow-path-marker", "lantern-stand"],
  neutralStateId: "seedwake-path-dark",
  answerNeutral: true
}
```

Every one of the exact 112 option IDs resolves to one record of the same shape. Within a scene, all options have the same `frameSemanticId` and `salienceTier`; an option depicts its proposed prop/action but never its result:

```js
{
  id: "scene-s1-option-use-mat",
  kind: "option",
  sceneId: "scene-s1",
  chapterId: "seedwake-meadow",
  comparisonFamilyId: "scene-s1-repair-actions",
  frameSemanticId: "scene-s1-repair-option-frame",
  salienceTier: "equal_choice",
  propSemanticIds: ["rolled-mat"],
  actionSemanticId: "use-mat",
  childLabel: "Use the mat.",
  accessibleLabel: "Use the mat."
}
```

Every assessed scene link has exactly one `postDecisionSemanticIds` entry. Every narrative scene link has exactly two, in the same canonical order as its `narrativeBranches`. A post-decision record is never present in `toChildConnectedTextScene()` before a reducer decision:

```js
{
  id: "scene-s1-post-decision",
  kind: "post_decision",
  sceneId: "scene-s1",
  chapterId: "seedwake-meadow",
  actionStateId: "seedwake-mat-unrolling",
  resolvedStateId: "seedwake-path-lit",
  consequenceId: "seedwake-path-lit",
  storyOutcomeId: null,
  meaningSemanticIds: ["meaning-mat-flat-ground-cover"]
}
```

An assessed post-decision record has `storyOutcomeId:null` and retains the expedition consequence. Each boss branch record has its distinct non-null `storyOutcomeId`, distinct `id`, and an action/resolved/consequence tuple distinct from its peer branch; the record is selected only by resolving the persisted Task 2 narrative token. There is no scene-wide boss post-decision fallback. The validator derives the complete forbidden pre-choice set from all option `propSemanticIds`/`actionSemanticId` values plus every eligible post-decision action, resolved state, consequence, story outcome, and meaning ID. None may occur in the pre-choice record. `resolveSceneVisualSemantic()` resolves every scene, pre-choice, option, post-decision, and meaning ID exactly once. A meaning registry record is exactly `{id,kind:"meaning",wordId}`; its `id` is byte-identical to one `MEANING_SUPPORT_RECORDS.visualSemanticId`. The mapping between meaning-support records and meaning semantic records is bijective, scenes reference that same ID directly, and no scene-local meaning anchor or alias namespace exists.

Task 4 maps these semantic IDs to layers, sprites, poses, and assets and phase-gates the post-decision semantics. Task 3 may not import that mapping, encode a filename masquerading as a semantic ID, or attach renderer-visible correctness. `toChildConnectedTextScene()` exposes only the neutral pre-choice record ID and the route-ordered peer option IDs; the reducer-authorized post-decision path supplies result/meaning IDs only after the choice.

Author exactly one arc per chapter and one beat per stop. Task 3 character records have exactly `{id,role,archetype}` and bijectively equal the guide plus three residents already in `SOUND_SEEKERS_CHAPTERS`; `id` is the exact existing cast `name`, not a new slug or alias, and role, archetype, and chapter ownership may not drift. Task 3 arcs contain no style, body-shape, palette, feature, role-prop, gear, pose, renderer, asset, or other visual-enrichment field. Task 4 `characterCatalog.js` and its `SOUND_SEEKERS_CHARACTER_VISUALS` are the sole owners of that cast visual enrichment and join it back by exact character/chapter identity.

Beat `n` matches the nth expedition's exact `relationshipBeatId`, `residentId`, `repairId`, and `consequenceId`. `getCastRelationshipBeat(relationshipBeatId)` returns that exact record. The first beat has `callbackRepairIds: []` and `callbackLines: []`. Every later beat includes the immediately preceding repair, contains only unique earlier repairs from the same chapter, and contains no future or cross-chapter repair. Its ordered `callbackLines` is a bijection over those IDs; every exact `{repairId,text}` line names the earlier concrete repair/result rather than use generic “before” or “again” prose. The fifth beat includes both the immediately preceding repair and the chapter's first repair, making the chapter arc visibly cumulative.

**Locked real-consumer/reload proof:** Task 3's source tests cannot substitute for downstream use. The runtime plan must make `tests/unit/soundSeekersPlaythrough.test.js` complete real earlier repairs through `completeMission()`, serialize and normalize the complete v2 state, enter the later canonical relationship beat, obtain it only through `getCastRelationshipBeat()`, filter its `callbackLines` only by exact true `state.trail.repairs`, and assert the rendered canonical resident/copy names the earlier repair after reload. A callback may not create evidence, a deck receipt/use, reward, repair, or relationship completion. The same downstream suite must complete both options of each boss, persist only the canonically derived `trail.storyOutcomes[sceneId]`, reload, and prove the chosen Task 3 `storyOutcomeId`/post-decision semantic returns while the unchosen branch never renders. Task 3 is not runtime-complete until those real consumers pass; a catalog lookup or serialize-only fixture is insufficient.

- [ ] **Step 4: Build separate usage provenance and concrete meaning support without changing pronunciation truth**

`REQUIRED_ACTION_MEANING_WORD_IDS` is derived from the committed Task 1 phases exactly as the test above specifies; the frozen 46-ID array is a drift alarm, not the primary source. Author one concrete support record for every derived ID and every unique `advancedTokenId` declared by a scene, with exact union semantics so an unused support record also fails. Function words are not advanced merely because they are function words. Each advanced ID names at least one exact ordered occurrence in `advancedTokenAudit`; its `advancedReason` is exactly one of `low_frequency`, `new_concept`, `polysemous`, `morphologically_complex`, or `ell_priority` and equals the support record's reason. No audit may point outside the scene's ordered `tokenIds`, reuse an ordinal for another token, or silently omit an authored advanced ID. Every scene carries `advancedTokenAuditDecision` with status `reviewed` or `reviewed_none_required`, ISO review time, reviewer role, and evidence reference; pending, missing, or self-contradictory provenance fails the task.

```js
{
  wordId: "mat",
  childDefinition: "A mat is a flat piece placed on the ground.",
  actionPrompt: "Lay both hands flat like a mat.",
  contrastPrompt: "A mat lies flat; it is not a box.",
  visualSemanticId: "meaning-mat-flat-ground-cover",
  audioKey: "quest/meaning/mat",
  ageBand: "5-8",
  ellSupport: {
    oralBridge: "Flat means spread out, not standing tall.",
    gesturePrompt: "Hold both hands flat and low."
  },
  advancedReason: null,
  answerLeakPolicy: "post_decision_or_non_assessed_help"
}
```

Definitions use the exact sense needed by the assessed action or scene, and prompts name one observable gesture/object relation. Every advanced record has reviewed age `5-8` metadata, a plain oral ELL bridge, a concrete gesture, and a semantic art reference. Each `visualSemanticId` is globally unique and resolves to the one Task 3 meaning semantic record whose `id` is exactly that value and whose `wordId` is exactly the support record's `wordId`; no anchor alias, translation table, or second meaning-ID namespace is permitted. Support is unavailable before an assessed response when it could reveal the answer. Reject generic templates such as “point to or mime,” circular definitions, the target used as its own explanation, a support visual that exposes an assessed key, duplicate support text for different meanings, internal IDs in child copy, and an advanced token not present in its scene's ordered `tokenIds`.

`buildSoundSeekersConnectedTextUsage.mjs` deterministically emits only `connectedTextUsage.generated.js`. Each sorted record is `{wordId,uses:[{sceneId,stopId,surface,ordinal}]}` where `surface` is one of `running_text`, `prompt`, `text_option`, `accessible_label`, or `meaning_support`; repeated canonical words retain distinct ordinals. Running text and visible text options fail if any token lacks a pronunciation ID. Prompt, accessible-label, and oral meaning-support copy may contain spoken-only explanation words; only tokens that resolve to an existing invariant ID enter pronunciation usage, and unresolved spoken-only words never create or modify a pronunciation record. The same module exports the sorted exact advanced-token union, its count derived as `.length`, and a SHA-256 over the JSON union. Runtime validation compares authored scenes to that generated invariant, so removing or renaming an advanced ID without regeneration fails and regenerating it produces a reviewable invariant diff. Default invocation is a read-only staleness check. Only `--write` may replace the single fixed output, using an atomic temporary sibling and cleanup; CLI output-path overrides, traversal, and writes to pronunciation/meaning authority are forbidden.

Run:

```bash
node tools/buildSoundSeekersConnectedTextUsage.mjs --write
node tools/buildSoundSeekersConnectedTextUsage.mjs
git diff --exit-code -- src/features/soundSeekers/content/pronunciationRecords.js src/features/soundSeekers/content/pronunciationCorpusInvariant.generated.js src/features/soundSeekers/content/pronunciationLexicon.js src/features/soundSeekers/content/wordMeanings.js tools/buildSoundSeekersPronunciationLexicon.mjs
```

Expected: the separate usage module is current, sorted, and complete; the exact 46 plus all authored advanced tokens have concrete support; the five pronunciation-authority paths have no Task 3 byte change. Tests hash those files before and after both default and `--write` usage-generator runs, verify invariant IDs/count/hash against the runtime corpus, and reject a generator with any additional write target.

- [ ] **Step 5: Generate and provenance-lock 40 text, 40 prompt, and derived meaning-support audios**

Use `en-US-Chirp3-HD-Leda`, locale `en-US`, and one asset per request. The expected asset list is derived, sorted, and exact:

```js
const expectedAudio = [
  ...CONNECTED_TEXT_RECORDS.flatMap(scene => [
    { assetId: `${scene.id}:text`, kind: "scene_text", text: scene.text,
      path: `/audio/quest-v2/scenes/${scene.id}-text.mp3` },
    { assetId: `${scene.id}:prompt`, kind: "scene_prompt", text: scene.prompt.text,
      path: `/audio/quest-v2/scenes/${scene.id}-prompt.mp3` }
  ]),
  ...MEANING_SUPPORT_RECORDS.map(record => ({
    assetId: `meaning:${record.wordId}`,
    kind: "meaning_support",
    text: `${record.childDefinition} ${record.ellSupport.oralBridge} ${record.actionPrompt}`,
    path: `/audio/quest-v2/meaning/${record.wordId}.mp3`
  }))
];
```

`generateSoundSeekersSceneAudio.mjs` defaults to offline `--check`; network generation requires explicit `--generate --asset scene-s1:text` (or another exact derived asset ID) or `--generate --all`. It rejects caller-supplied text/path/voice, unknown or duplicate asset IDs, path traversal, symlink destinations, source drift, and an output outside the two fixed audio roots. It makes one bounded request per missing/stale asset, never logs credentials or response headers, writes to a `mkdtemp` directory outside `public`, validates non-empty decodable audio and bounded duration/signal, and encodes the accepted voice asset to the one exact final profile `codec:"mp3"`, `sampleRateHz:44100`, `channels:1`, `bitrateBps:128000`, matching the committed v2 instruction-audio profile. It probes those four properties from the final bytes rather than trusting request metadata, hashes the final bytes and exact UTF-8 source text, then atomically renames the asset. It removes every temporary artifact on success, failure, or interruption.

An exact current asset is skipped. Replacing a different existing hash requires explicit `--replace`; replacement clears any prior listening approval because approval belongs to bytes. The generator may add mechanical provenance with `humanListeningApproved:false`, but it may never create or edit human approval. `SOURCE.md` contains one machine-parseable JSON fence, sorted by `assetId`, and exactly these fields:

```js
{
  assetId, kind, ownerId, text, textSha256, voice, model, locale,
  generatorVersion, generatedAt, path, byteLength, durationSeconds,
  codec, sampleRateHz, channels, bitrateBps, meanVolumeDb, peakDb, sha256,
  humanListeningApproved, humanListeningReview
}
```

`ownerId` is the scene ID for text/prompt and the word ID for meaning support. `codec`, `sampleRateHz`, `channels`, and `bitrateBps` equal the probed final file and the exact profile above; a missing, string-coerced, zero, unexpected, or manifest-only value fails. `humanListeningReview` is `null` while false. A true record requires `{sha256,textSha256,reviewedAt,reviewerRole,environment,decision:"approved",evidenceRef}` matching the current byte and text hashes. Automated duration, decoding, waveform, codec, sample-rate, channel, bitrate, or transcript checks never set approval.

`tests/unit/soundSeekersSceneAudio.test.js` exercises the unchanged shared `tools/generateAudioManifest.js` in a `mkdtemp` fixture: copy the real script, add a minimal `{ "type": "module" }` package file, create a minimal baseline `public` audio tree, run it once, hash all five outputs, add representative files under both fixed Task 3 audio roots, run it again, and compare bytes. The exact changed set is `audioFilePaths.generated.js` and `audioQuestPaths.generated.js`; `audioChoiceKeys.generated.js`, `audioPhonemePaths.generated.js`, and `audioGuidedReadingPaths.generated.js` remain byte-identical. The fixture is removed in `finally`. Task 3 does not modify or stage `tools/generateAudioManifest.js` or those three unchanged shared manifests.

Run:

```bash
node tools/generateSoundSeekersSceneAudio.mjs --generate --all
node tools/checkSoundSeekersSceneAudio.mjs
node tools/generateAudioManifest.js
git diff --exit-code -- src/data/generated/audioChoiceKeys.generated.js src/data/generated/audioPhonemePaths.generated.js src/data/generated/audioGuidedReadingPaths.generated.js
git diff --name-only -- src/data/generated/audioFilePaths.generated.js src/data/generated/audioChoiceKeys.generated.js src/data/generated/audioPhonemePaths.generated.js src/data/generated/audioGuidedReadingPaths.generated.js src/data/generated/audioQuestPaths.generated.js
node --test tests/unit/soundSeekersSceneAudio.test.js
```

Expected: exactly `80 + SOUND_SEEKERS_MEANING_SUPPORT.length` final MP3s; no missing, extra, zero-byte, undecodable, wrong-codec, wrong-sample-rate, wrong-channel-count, wrong-bitrate, symlinked, or temporary asset; exact source/path/text/technical-profile/hash joins; and current general/quest audio manifests. The manifest name command prints exactly `src/data/generated/audioFilePaths.generated.js` and `src/data/generated/audioQuestPaths.generated.js`; the other three shared outputs are byte-identical. The checker is offline and read-only, rejects malformed/duplicate/unknown manifest fields and orphan files, and reports mechanical validity separately from direct listening. If any current hash lacks direct listening evidence, the human-listening release gate remains explicitly open.

- [ ] **Step 6: Run content, leakage, generator, audio, and legacy regressions**

Run:

```bash
node --test tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersConnectedTextPresentation.test.js tests/unit/soundSeekersConnectedTextGenerator.test.js tests/unit/soundSeekersMeaningSupport.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersSceneAudio.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentTransactions.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersEvidenceEligibility.test.js tests/unit/soundSeekersPronunciationLexicon.test.js
node tools/buildSoundSeekersConnectedTextUsage.mjs
node tools/buildSoundSeekersPronunciationLexicon.mjs
node tools/checkSoundSeekersSceneAudio.mjs
npm run check:quest
git diff --check
```

Expected: PASS with exact 40 scenes, 40 story joins, 40 transfer joins, 32 assessed connected-text decisions with exactly three options each, 8 narrative boss bridges with exactly two options each, exactly two non-key evaluator tokens per assessed scene, the full imported transfer tuple, all 40 scenes completed in one Task 2 transaction state through pending wrong→reload→fresh correct, separate two- and three-miss pending/model-pending/modeled/completed whole-history reloads, exact valid receipts, exact 64/16 total attempt evidence and 32/8 final-pair evidence, all eight canonical three-choice boss challenges, 16 durable branch mappings whose two options produce distinct reload-stable outcomes, and no narrative evidence, canonical connected-text evidence nulls with absent `activityType`, branded pre-choice/repeated-correction/action/resolved/every-direct-meaning transitions with exact `correctionRecordId`, strict exact-current checkpoint rebuilding with prior-state/transition/capability invalidation on advance/reload/replace/close plus clone/identity/tamper rejection, the exact minimal child projection and repository-wide static/re-export/dynamic-import boundary including exact Task 6 replay edges, every visible label stop-readable, wholly private evaluator maps, no structural/textual/visual answer leakage, deterministic readability/tokenization/option order, complete exact meaning support with union equality, deterministic earliest-scene/post-decision owners, and one direct semantic-ID namespace, 8 identity-only arcs/32 identities/40 durable callback-capable beats, pure split 40/112/48 semantic visuals, full technical audio provenance, only the two intended audio-manifest diffs, current usage/audio generators, byte-stable pronunciation authority, and legacy quest integrity. These tests prove **structural reachability**: every committed expedition/deck identity resolves a valid scene and asset. They do not prove **runtime reachability**: only the later runtime plan's real 40-stop mission simulation and locked reload consumers may claim that every scene, story branch, callback, meaning payoff, consequence, and replay path was actually entered and completed.

- [ ] **Step 7: Stage only Task 3, inspect the boundary, and commit**

```bash
git add -A -- src/features/soundSeekers/content/connectedTextRecords.js src/features/soundSeekers/content/connectedTextAnswerKeys.js src/features/soundSeekers/content/connectedText.js src/features/soundSeekers/engine/connectedTextPresentation.js src/features/soundSeekers/content/connectedTextUsage.generated.js src/features/soundSeekers/content/meaningSupportRecords.js src/features/soundSeekers/content/meaningSupport.js src/features/soundSeekers/content/castArcs.js src/features/soundSeekers/content/sceneVisualSemantics.js tools/buildSoundSeekersConnectedTextUsage.mjs tools/generateSoundSeekersSceneAudio.mjs tools/checkSoundSeekersSceneAudio.mjs public/audio/quest-v2/SOURCE.md public/audio/quest-v2/scenes public/audio/quest-v2/meaning src/data/generated/audioFilePaths.generated.js src/data/generated/audioQuestPaths.generated.js tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersConnectedTextPresentation.test.js tests/unit/soundSeekersConnectedTextGenerator.test.js tests/unit/soundSeekersMeaningSupport.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersSceneAudio.test.js
git diff --cached --name-status
git diff --cached --check
git commit -m "feat: author Sound Seekers connected stories"
```

The cached list must contain only the Task 3 paths above. It must not contain the content/art plan itself, any Task 1/2 implementation path, any pronunciation-authority path, `tools/generateAudioManifest.js`, `audioChoiceKeys.generated.js`, `audioPhonemePaths.generated.js`, `audioGuidedReadingPaths.generated.js`, any Task 4 visual implementation, temporary audio, or an unreviewed human-approval edit. The two staged audio manifests are the only shared generated outputs whose bytes may change.

### Task 4: Define eight semantic biome contracts and the code-native visual language

**Dependency and collision stop:** Do not begin Task 4 from uncommitted Task 1 or Task 3 work. The reviewed Task 1 expedition/chapter implementation and reviewed Task 3 connected-text, meaning, cast-arc, and scene-semantic implementation must each be committed, and their focused tests must pass at those commits. Task 4 imports their actual exports; it may not restate a planned identity or add a visual alias for a missing dependency. Before editing, confirm every Task 4 path below is clean. If any is dirty, or either dependency is still under review, stop and report Task 4 blocked.

**Files:**
- Create: `src/features/soundSeekers/content/biomeKits.js`
- Create pure: `src/features/soundSeekers/visual/sceneVisualCatalog.js`
- Create pure: `src/features/soundSeekers/visual/characterCatalog.js`
- Create: `src/features/soundSeekers/visual/visualTokens.js`
- Create: `src/features/soundSeekers/engine/sceneVisualAccess.js`
- Create pure: `src/features/soundSeekers/visual/backgroundImageState.js`
- Create: `src/features/soundSeekers/visual/LayeredBiome.jsx`
- Create: `src/features/soundSeekers/visual/SceneVisual.jsx`
- Create: `src/features/soundSeekers/visual/CharacterSystem.jsx`
- Create pure: `src/features/soundSeekers/visual/characterCustomization.js`
- Create: `src/features/soundSeekers/visual/CharacterCreator.jsx`
- Create: `src/features/soundSeekers/visual/Landmark.jsx`
- Create: `src/features/soundSeekers/visual/visual-system.css`
- Create: `tests/unit/soundSeekersBiomeKits.test.js`
- Create: `tests/unit/soundSeekersSceneVisualCatalog.test.js`
- Create: `tests/unit/soundSeekersSceneVisualAccess.test.js`
- Create: `tests/unit/soundSeekersVisualSemantic.test.js`
- Create: `tests/unit/soundSeekersCharacterCreator.test.js`
- Create: `tests/fixtures/soundSeekersVisualHarness.html`
- Create: `tests/fixtures/soundSeekersVisualHarness.jsx`
- Create: `tests/browser/sound-seekers-visual-fallback.spec.js`

`biomeKits.js`, `sceneVisualCatalog.js`, `characterCatalog.js`, `visualTokens.js`, `backgroundImageState.js`, and `characterCustomization.js` contain frozen data and pure validation/derivation only. Task 3 `connectedTextPresentation.js` is the sole transition authority. Task 4 `sceneVisualAccess.js` is only the deterministic ephemeral-capability boundary; its only internal mutations are adding/deleting exact frozen access identities in one module-private current-object `WeakSet` and binding/deleting each access's exact source transition in one module-private `WeakMap`. Neither collection is exported or enumerable. None imports React, Phaser, Three.js, CSS, Task 5 files, public assets, legacy quest renderers, or current book-avatar/pixel-character renderers. `sceneVisualCatalog.js` and `characterCatalog.js` may import only the named Task 1/3 authorities below and the exact pure Task 4 dependencies declared next.

The pure dependency graph is acyclic and exact. A parsed-import test uses these complete allowlisted local edges; an omitted edge is forbidden:

```js
{
  "visualTokens.js": [],
  "backgroundImageState.js": [],
  "characterCustomization.js": ["visualTokens.js"],
  "characterCatalog.js": [
    "content/chapters/index.js", "content/castArcs.js", "visualTokens.js"
  ],
  "engine/sceneVisualAccess.js": ["engine/connectedTextPresentation.js"],
  "sceneVisualCatalog.js": [
    "content/chapters/index.js", "content/expeditions.js", "content/connectedText.js",
    "content/sceneVisualSemantics.js", "content/meaningSupport.js",
    "engine/sceneVisualAccess.js", "characterCatalog.js", "visualTokens.js"
  ],
  "biomeKits.js": [
    "content/chapters/index.js", "sceneVisualCatalog.js", "visualTokens.js"
  ]
}
```

The test canonicalizes relative import specifiers, rejects dynamic imports and extra local edges in these dependency-bound modules, then topologically sorts this graph. It additionally parses named imports and requires `sceneVisualAccess.js` to import exactly `isConnectedTextPresentationTransition` and `projectConnectedTextPresentationTransition` from Task 3—no scene semantic resolver, presentation reducer, Task 2 state/transaction module, renderer, evidence module, or answer-key module. `sceneVisualCatalog.js` imports exactly `isConnectedTextChildScene` from `content/connectedText.js` and `validateSceneVisualAccess` from `engine/sceneVisualAccess.js`; it uses the former only to require a genuine Task 3 child projection and reject spread, cloned, serialized, or caller-authored lookalikes. Access imports no catalog, so the resolver can authenticate a capability and then resolve semantics without a cycle. In particular, neither catalog imports `biomeKits.js`, `characterCatalog.js` does not import `sceneVisualCatalog.js`, and `sceneVisualAccess.js` never becomes a second transition validator. `resolveSceneVisualPresentation()` therefore returns a `kitId`, not a biome object; `SceneVisual.jsx` is the first layer allowed to call `getBiomeKit(kitId)` and join the pure catalogs for rendering.

Task 4 declares the exact eight future raster paths, immutable generation briefs, semantic/crop contracts, and code-native renderers, but it never reads or requires a Task 5 file. Task 5 remains the sole producer of v2 raster files. Task 4 must not fail because those eight public files do not exist yet: a Vite build cannot prove that a root-relative public URL exists, and the complete code-native fallback is tested without Task 5.

**Authoritative inputs and forbidden imports:**
- Consume Task 1 `SOUND_SEEKERS_CHAPTERS` and `SOUND_SEEKERS_EXPEDITIONS` for the exact eight chapter IDs, 40 ordered stop IDs, 40 route-topology positions, 40 repair IDs, and canonical cast. A cast identity is the existing case-sensitive `cast.guide.name` or `cast.residents[].name`; Task 4 never copies or renames its role/archetype identity.
- Consume Task 3 `SOUND_SEEKERS_CAST_ARCS`, `SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS`, `SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS`, `SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS`, `SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS`, `SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES`, `SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS`, `SOUND_SEEKERS_MEANING_VISUAL_OWNERS`, `SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY`, `getSceneVisualSemantics(sceneId)`, `resolveNarrativeBranchOutcome(sceneId,narrativeChoiceToken)`, `resolveSceneVisualSemantic(semanticId)`, `SOUND_SEEKERS_MEANING_SUPPORT`, `getMeaningSupport(wordId)`, `REQUIRED_ACTION_MEANING_WORD_IDS`, and `ADVANCED_SCENE_TOKEN_IDS`. Task 4 consumes those exact split records; it never reconstructs an old flat scene shape or a scene-wide boss consequence. Only `sceneVisualAccess.js` additionally consumes Task 3 `isConnectedTextPresentationTransition()` and `projectConnectedTextPresentationTransition()` as the sole transition-capability seam.
- Rendering accepts only the child-safe object returned by Task 3 `toChildConnectedTextScene(sceneId, routeSeed)`. A Task 4 production module must not import `connectedTextRecords.js`, `CONNECTED_TEXT_RECORDS`, `connectedTextAnswerKeys.js`, an answer key, `expectedToken`, `distractorRationale`, or any full reducer-private scene/challenge.
- Legacy `QuestPixelWorld`, `QuestTrail2D`, `questPixelRuntime`, Phaser, Three.js, `bookCharacterAvatar.js`, `creatureParts.js` palettes/persistence, and `/game-assets/quest-pixel/` or `/game-assets/sound-seekers/characters/` rasters are migration references only. Task 4 imports none of them. Audited project-authored vector path geometry may be deliberately adapted only after it is copied into the v2 style/token/anchor contract; no old renderer, raw palette, identity, or asset URL becomes v2 authority implicitly.

**Exact outputs and cardinalities:**
- Export `SOUND_SEEKERS_VISUAL_TOKENS`, `SOUND_SEEKERS_CONTRAST_PAIRS`, `SOUND_SEEKERS_BIOME_KITS`, `SOUND_SEEKERS_SCENE_RENDER_SPECS`, `SOUND_SEEKERS_OPTION_VISUALS`, `SOUND_SEEKERS_MEANING_VISUALS`, `SOUND_SEEKERS_SEMANTIC_VISUALS`, `SOUND_SEEKERS_ROUTE_SPECS`, `SOUND_SEEKERS_LANDMARK_BINDINGS`, `SOUND_SEEKERS_CHARACTER_VISUALS`, `SOUND_SEEKERS_PLAYER_VISUAL`, `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS`, `SOUND_SEEKERS_POSE_IDS`, and `SOUND_SEEKERS_POSE_RENDERERS`.
- Export `getBiomeKit(chapterId)`, `resolveSemanticVisual(semanticId)`, `resolveMeaningVisual(semanticId)`, `resolveSceneVisual(sceneId)`, `computeBackgroundCrop({sourceSize,targetSize,focalPoint})`, `contrastRatio(foregroundTokenId,backgroundTokenId)`, and `resolveSceneVisualPresentation(childScene,{activeAttemptId,reducerRevision,sceneAccess})`.
- Export `issueSceneVisualAccess(presentationTransition,{sceneId,attemptId,reducerRevision})` for reducer-integration use plus `validateSceneVisualAccess(sceneAccess,{sceneId,attemptId,reducerRevision})`. Export `createBackgroundImageState(src)` and `reduceBackgroundImageState(state,event)` as the deterministic image-failure seam.
- Export pure validation/signature helpers `validateSoundSeekersVisualCatalogs(catalogs)`, `codeNativeBiomeSignature(kit)`, `characterVisualSignature(visual)`, `resolvePoseRenderer(poseId)`, and `poseCompositionSignature(pose)` so negative mutation tests exercise the same authority used at module initialization.
- Export `createCharacterAppearance(raw)`, `serializeCharacterAppearance(appearance)`, `deserializeCharacterAppearance(serialized)`, and `appearanceSignature(appearance)`.
- Render through `<LayeredBiome kit scenePresentation cropProfile densityProfile motionProfile backgroundImageState />`, `<SceneVisual childScene activeAttemptId reducerRevision sceneAccess cropProfile densityProfile motionProfile onChoose />`, `<SoundSeekersCharacter characterId pose appearance />`, `<SoundSeekersCharacterCreator value onChange />`, and `<Landmark landmark stateId />`.
- The exact counts are 8 biome kits, 40 scene render specs, 48 post-decision visual joins, 40 stop-keyed route specs, 40 stop/repair landmark bindings, 32 canonical cast-character visual records, one separate player visual, and 112 option visual records: three for each of 32 assessed scenes plus two for each of eight narrative boss bridges.
- `SOUND_SEEKERS_MEANING_VISUALS` has one record for every exact Task 3 meaning semantic record and no other record. Its `semanticId` is byte-identical to the Task 3 record `id`, and its `wordId` is byte-identical to that record and the joined public meaning-support record. There is no anchor record, alias, binding table, translation layer, or second meaning namespace.
- `SOUND_SEEKERS_SEMANTIC_VISUALS` is the globally unique, kind-discriminated renderer catalog for the exact union of every Task 3 pre-choice setting/character/neutral-prop/neutral-state reference, every option frame/prop/action reference, every post-decision action/resolved/consequence/direct-meaning reference, plus every Task 4 route/landmark/code-native kit reference. Every referenced ID resolves exactly once with its declared kind/chapter; an unknown, duplicate, cross-chapter, wrong-kind, unused renderer ID, or renderer record that embeds answer/correctness metadata fails validation.

**Task 3 scene-to-render contract:**

`SOUND_SEEKERS_SCENE_RENDER_SPECS` is derived by exact ID join with all 40 Task 3 scene-link records, not by array position. It preserves the split references rather than flattening answer-neutral and post-decision data together:

~~~js
{
  id: "scene-s1-visual",
  sceneId: "scene-s1",
  chapterId: "seedwake-meadow",
  preChoiceSemanticId: "scene-s1-pre-choice",
  optionSemanticIds: [
    "scene-s1-option-use-mat",
    "scene-s1-option-ring-bell",
    "scene-s1-option-lift-lantern"
  ],
  postDecisionSemanticIds: ["scene-s1-post-decision"],
  characterBindings: [
    { characterId: "Bouncy", poseByPhase: {
      pre_choice: "idle", action: "anticipate", resolved: "react", meaning_support: "explain"
    } },
    { characterId: "Moss", poseByPhase: {
      pre_choice: "encourage", action: "react", resolved: "celebrate", meaning_support: "explain"
    } }
  ],
  answerNeutralBeforeChoice: true
}
~~~

The render validator resolves `preChoiceSemanticId` to the exact Task 3 pre-choice record, all three/two `optionSemanticIds` to exact Task 3 peer-option records, and every `postDecisionSemanticIds` entry to the exact Task 3 post-decision record. An assessed render spec joins exactly one post-decision record. A boss render spec joins exactly two in the canonical `SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES` order, with distinct non-null story outcomes and action/resolved/consequence tuples; there is no generic boss fallback. At no point does it copy option props/actions or post-decision action/result/consequence/meaning IDs into the pre-choice render spec. The pre-choice resolver may use only the Task 3 record's `settingId`, `characterIds`, `neutralPropIds`, and `neutralStateId`. Each option renderer may use only that option record's `comparisonFamilyId`, `frameSemanticId`, `salienceTier`, `propSemanticIds`, and `actionSemanticId`. Later phases may use only the one post-decision record named by a valid current capability.

A Task 4 meaning renderer record uses the one Task 3 meaning namespace directly:

~~~js
{
  semanticId: "meaning-mat-flat-ground-cover",
  wordId: "mat",
  rendererKind: "code-native-svg",
  shapeFamilyId: "flat-ground-cover",
  actionPoseId: "meaning-action:lay-flat",
  accessibleLabel: "A flat mat on the ground."
}
~~~

`semanticId` is exactly the Task 3 meaning semantic record `id` and joined public `SOUND_SEEKERS_MEANING_SUPPORT.visualSemanticId`; `wordId` is identical across both records. Scenes reference that same semantic ID from `postDecision.meaningSemanticIds`. `resolveMeaningVisual(semanticId)` accepts only an exact Task 3 meaning semantic ID and returns its one frozen Task 4 renderer; it rejects another semantic kind and provides no timing, correctness, or evidence authority. No `meaningSupportAnchorId`, `anchorId`, `meaningVisualSemanticId`, or other alias field is permitted anywhere in Task 4.

`resolveSceneVisualPresentation()` accepts an exact Task 3 child view and validates that its `id`, `chapterId`, `visualSemanticId`, `residentId`, and route-ordered option visual IDs match the split Task 3 semantic registry. It separately validates the joined pre-choice record's `characterIds` against the canonical Task 1 cast, including that exact resident. It returns only:

~~~js
{
  sceneId,
  chapterId,
  scenePhase,
  visualStateId,
  kitId,
  setting,
  characters,
  focalProps,
  options,
  meaningVisual
}
~~~

It never returns an answer, correctness flag, rationale, expected token, evidence field, capability internals, reducer transition, or narrative token. Without `sceneAccess`, the phase is always `pre_choice`; a caller cannot supply `scenePhase`, `visualStateId`, `storyOutcomeId`, a boolean post-decision flag, or a meaning word directly.

At `pre_choice`:
- `answerNeutralBeforeChoice` must be `true`;
- `visualStateId` is the Task 3 pre-choice record's `neutralStateId`;
- `meaningVisual` is `null`;
- every option preserves the child view's randomized order and child/accessibility labels but uses the same frozen affordance `{minCssPx:56,frameTokenId:"choice-neutral",emphasisRank:0,motionCueId:null}`;
- the scene contains only the pre-choice record's neutral props/state; every option stays inside its peer frame and cannot leak its proposed result into the scene; and
- background, setting, character pose vocabulary, scale, frame, salience, local contrast, outline, animation, and the renderer attached to a semantic option ID are byte-stable across route seeds and cannot vary according to the reducer key.

`sceneVisualAccess.js` is the Task 3-transition-to-render boundary. `issueSceneVisualAccess(presentationTransition,{sceneId,attemptId,reducerRevision})` first requires `isConnectedTextPresentationTransition(presentationTransition) === true`, then obtains identity only by calling `projectConnectedTextPresentationTransition(presentationTransition)`. It never accepts a projection directly. Exact scene, active attempt, and exact current reducer revision must equal the projection; phase, post-decision ID, branch outcome, and optional meaning ID are copied only from that projection and are not caller inputs. Only Task 3 exact-current `action`, `resolved`, or `meaning_support` transitions are issuable; `pre_choice`, every branded correction (including `model_pending`), a caller boolean, and a hand-authored/frozen/serialized/prior-revision/prior-scene transition fail. Task 4 never decides whether a literacy or boss response was correct. The issuer returns this exact enumerable child-safe payload:

~~~js
{
  kind: "scene_visual_access",
  sceneId: "scene-s1",
  attemptId: "attempt:scene-s1:1",
  reducerRevision: 7,
  decisionId: "attempt:scene-s1:1:0",
  phase: "resolved",
  postDecisionSemanticId: "scene-s1-post-decision",
  storyOutcomeId: null,
  meaningSemanticId: null
}
~~~

The frozen object is added to module-private `currentAccessObjects: WeakSet` and bound by module-private `sourceTransitionByAccess: WeakMap` to the exact source transition identity; neither registry is exported or enumerable. A plain object, spread, JSON round trip, or `structuredClone()` loses current-object membership and is invalid. `validateSceneVisualAccess(sceneAccess,{sceneId,attemptId,reducerRevision})` first requires that exact WeakSet membership and base context, obtains the privately retained source transition from the WeakMap, then re-runs `isConnectedTextPresentationTransition()` and `projectConnectedTextPresentationTransition()` and requires every access field—including phase, post-decision semantic, story outcome, and direct meaning—to equal the fresh projection. If the source is no longer exact-current or any comparison fails, validation deletes that access from both registries before returning `false`; a later call cannot revive it. Thus any Task 3 revision advance, presentation replacement, rehydrate, or explicit close immediately makes every access previously issued from that transition invalid at its next validation/resolution, even if the caller supplies its old base context. Capabilities are ephemeral and never persisted. After resume, Task 3 validates the complete canonical Task 2 attempt history and privately rebuilds one fresh final revision; Task 4 issues a new capability only from that exact freshly branded final transition. A capability is single-generation and single-revision: advancing, rehydrating, restarting, closing, leaving, or beginning another scene makes it stale.

`sceneVisualCatalog.js` owns `resolveSceneVisualPresentation()` and imports only `validateSceneVisualAccess()` from the access module. With a valid `action` or `resolved` capability, the resolver selects only the post-decision semantic ID already authenticated in the Task 3 projection and joined among that scene render spec's one/two allowed IDs. For a boss it also requires that record's non-null `storyOutcomeId` equal the capability's derived value; for an assessed scene both are null. `meaning_support` additionally requires exact equality with the projection's non-null direct `meaningSemanticId`; Task 3 has already enforced membership in the chosen post-decision record and public meaning-support policy, while Task 4 only resolves that same ID through `resolveMeaningVisual()`. No arbitrary boolean, caller-provided word/outcome, alias, projection literal, correction access, or pre-choice capability is accepted. Separately, canonical Word Forge and Blend Bridge runtime adapters may call pure `resolveMeaningVisual(getMeaningSupport(wordId).visualSemanticId)` only in their authored non-assessed target/help or reducer-authorized post-commit payoff states; Task 4 itself does not invent that authority. Task 4 never decides correctness, reads an answer key, creates literacy evidence, or turns visual interaction into evidence.

**Eight immutable biome/background contracts:**

Each kit has the exact top-level shape:

~~~js
{
  id,
  paletteTokenId,
  lightingTokenId,
  background: {
    src,
    provenanceId,
    expectedAspect: [16, 9],
    minSize: [1536, 864],
    cropProfiles: {
      landscape: { targetSize: [568, 320], focalPoint: [x, y], quietZone: { x, y, width, height } },
      tablet: { targetSize: [1194, 834], focalPoint: [x, y], quietZone: { x, y, width, height } },
      portrait: { targetSize: [320, 568], focalPoint: [x, y], quietZone: { x, y, width, height } }
    }
  },
  backgroundGenerationBrief: {
    styleId: "sound-seekers-painted-shape-v2",
    environmentDescription,
    requiredBackdropElements,
    backdropReviewSemanticIds,
    forbiddenSemanticIds,
    forbiddenContent: [
      "characters", "interactive objects", "interface", "letters", "words",
      "logos", "watermarks", "borders"
    ]
  },
  backdropReviewSemanticIds,
  codeNativeSemanticIds,
  layers,
  routeSpecIds,
  landmarkIds,
  propFamilyId,
  rewardFamilyId,
  wonderEffectId
}
~~~

All objects/arrays are recursively frozen. `backgroundGenerationBrief.backdropReviewSemanticIds` equals the kit's `backdropReviewSemanticIds` exactly, and `backgroundGenerationBrief.forbiddenSemanticIds` equals its `codeNativeSemanticIds` exactly. Backdrop IDs describe only stable, answer-neutral place identity that a person can judge in the raster. Code-native IDs include every route, landmark/state, resident, option, meaning action, interactable, grapheme plate, focus/feedback, and answer-bearing object; none may be requested in, recognized from, or human-approved as part of a background raster.

The eight exact Task 5 handoffs are:

| Chapter ID | Exact background path | Provenance ID | Immutable environment description | Exact ordered `requiredBackdropElements` | `backdropReviewSemanticIds` |
|---|---|---|---|---|---|
| `seedwake-meadow` | `/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp` | `ssv2-seedwake-meadow-bg` | Dawn pasture, living hedges, warm wood, distant seed-lantern glow, pale gold and fresh green; quiet lower-middle lane. | `dawn pasture`; `living hedges`; `distant windmill lantern silhouette` | `dawn-pasture`, `living-hedge-depth`, `windmill-lantern-silhouette` |
| `river-gardens` | `/game-assets/sound-seekers/v2/biomes/river-gardens/background.webp` | `ssv2-river-gardens-bg` | Terraced water channels, reeds, ceramic garden markers, turquoise and terracotta; quiet lower-middle lane. | `terraced water channels`; `reed banks`; `distant ceramic terrace markers` | `terraced-water-channels`, `reed-bank-depth`, `ceramic-terrace-markers` |
| `fossil-canyon` | `/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp` | `ssv2-fossil-canyon-bg` | Layered sandstone shelves, ancient tracks, bone arches and amber afternoon depth; quiet lower-middle lane. | `layered sandstone shelves`; `ancient track bed`; `distant bone arch` | `layered-sandstone-shelves`, `ancient-track-bed`, `bone-arch` |
| `forge-settlement` | `/game-assets/sound-seekers/v2/biomes/forge-settlement/background.webp` | `ssv2-forge-settlement-bg` | Dark-stone workshops, distant furnace architecture, copper-and-iron depth and controlled ember light; quiet lower-middle lane. | `distant furnace architecture`; `dark-stone workshops`; `copper rail depth` | `furnace`, `dark-stone-workshops`, `copper-rail-depth` |
| `glass-marsh` | `/game-assets/sound-seekers/v2/biomes/glass-marsh/background.webp` | `ssv2-glass-marsh-bg` | Reflective jade pools, glass-reed depth, mist and refracted distant paths; quiet lower-middle lane. | `reflective jade pools`; `distant glass reeds`; `mist path depth` | `reflective-jade-pools`, `glass-reed-depth`, `mist-path-depth` |
| `storm-coast` | `/game-assets/sound-seekers/v2/biomes/storm-coast/background.webp` | `ssv2-storm-coast-bg` | Sea cliffs, spray, distant timber shelters and a storm clearing toward warm light; quiet lower-middle lane. | `sea cliffs`; `distant timber shelters`; `storm clearing toward warm light` | `sea-cliff`, `timber-shelter-depth`, `clearing-storm` |
| `lantern-forest` | `/game-assets/sound-seekers/v2/biomes/lantern-forest/background.webp` | `ssv2-lantern-forest-bg` | Deep layered woods, root-bridge depth, distant hanging lantern path, moss and muted gold; quiet lower-middle lane. | `deep layered woods`; `distant root bridges`; `distant hanging lantern path` | `deep-wood-layers`, `root-bridge-depth`, `hanging-lantern-path` |
| `star-reach` | `/game-assets/sound-seekers/v2/biomes/star-reach/background.webp` | `ssv2-star-reach-bg` | High observatory terraces, distant comet stairs, night sky, indigo and warm starlight; quiet lower-middle lane. | `high observatory terraces`; `distant comet stairs`; `night sky` | `observatory`, `comet-stair-depth`, `night-sky` |

`requiredBackdropElements` is exactly the ordered three-string array shown in its table row, not a value generated from IDs. Task 5 composes the shared style prompt plus this exact frozen brief, records it in provenance, and reviews `backdropReviewSemanticIds` only. It may not restate or add a code-native object. Exactly these eight root-relative URLs are allowed in Task 4; no character, item, UI, scene-option, landmark, or additional v2 raster URL is declared.

Every crop profile's `targetSize` is the literal real-device evidence size shown above; no profile contains or accepts a separately authored `targetAspect`. Focal coordinates and quiet-zone `x`, `y`, `width`, and `height` are finite normalized values in `[0,1]`; width/height are positive and the quiet-zone rectangle stays in bounds. `computeBackgroundCrop()` validates positive finite integer `sourceSize` and one of the three literal `targetSize` pairs, derives `s = sourceSize[0] / sourceSize[1]` and `t = targetSize[0] / targetSize[1]` internally, then works in normalized source coordinates. It uses `{width:1,height:s/t}` when `t >= s` and `{width:t/s,height:1}` otherwise, centers that rectangle on the focal point, and clamps `x`/`y` without resizing. It returns exactly `{x,y,width,height,objectPosition}`. Validation proves the focal point and all four quiet-zone corners are inside that exact retained rectangle for `[568,320]`, `[1194,834]`, and `[320,568]`. Task 5 and Task 6 import this same solver and consume those returned rectangles; neither may invent crop math, derive a different target size, or substitute a generic aspect label. The Task 5 source-normalization crop remains the separate largest-integer 16:9 transform that produces the exact 1536×864 public WebP.

`backgroundImageState.js` owns the deterministic decorative-image seam. `createBackgroundImageState(src)` returns frozen `{src,status:"pending",revision:0}`. `reduceBackgroundImageState(state,{type:"loaded"|"failed",src})` changes status only when `src` exactly matches the active source; a stale source or duplicate event is an identity-preserving no-op. `{type:"source_changed",src}` returns a new pending state with `revision + 1`. `LayeredBiome` always renders the complete code-native setting silhouette, route, landmarks, residents, choices, state, focus, labels, and feedback independently of image state. The decorative image is `aria-hidden`; pending or failure cannot produce a loading/blank world or carry the only copy of a learning/place cue.

The eight code-native kits must be semantically distinct independently of their raster, IDs, and palette. `codeNativeBiomeSignature(kit)` resolves route topology families, route material shape, landmark shape/part/pattern families, prop shape family, reward shape family, and wonder effect composition, then hashes that normalized substance after removing IDs, chapter names, raw colors, palette tokens, lighting tokens, labels, and background fields. All eight signatures are unique, and each pair differs on at least two of route topology, landmark structure, prop/reward structure, or wonder composition. Renaming cloned records, swapping only palette/background, or changing only labels must collide and fail.

**Typed world, route, landmark, and profile contracts:**

Each kit has exactly one layer for each ordered plane `background`, `midground`, `route`, `foreground`, `interaction`, and `effects`. A layer is exactly:

~~~js
{
  id,
  plane,
  zIndex,
  rendererKind,
  semanticIds,
  essentialSemanticIds,
  densityProfiles: ["full", "simplified"],
  motionProfiles: ["full", "reduced"]
}
~~~

Only the background plane uses `rendererKind: "background-raster"`, and its semantic IDs equal `backdropReviewSemanticIds`. Every other plane uses `code-native-svg` or `code-native-dom` and contains only `codeNativeSemanticIds`. `zIndex` is finite and strictly increases in plane order. `essentialSemanticIds` is a subset of `semanticIds`; simplified mode may reduce decorative density but cannot remove a route, required setting cue, landmark/current state, resident reaction, option, meaning support once allowed, focus, label, or feedback. Effects are nonessential; every effect/pose transition has an explicit reduced-motion outline/opacity/static-final-state replacement and no continuous nonessential animation.

`visualTokens.js` exports raw colors once and `SOUND_SEEKERS_CONTRAST_PAIRS` as frozen exact records `{id,foregroundTokenId,backgroundTokenId,minRatio,use}`. Every normal child-text pair uses `minRatio:4.5`; every focus ring, option boundary, interactable boundary, and state-outline pair uses `minRatio:3`. `contrastRatio()` resolves token colors and implements WCAG relative luminance; unknown tokens, alpha without an explicitly composed opaque background, a lower ratio, or a used text/focus/interactive pair absent from the registry fails. CSS may consume only these named tokens and cannot override a checked pair with a raw color.

The presentation dimensions are:
- `cropProfile`: exactly `landscape`, `tablet`, or `portrait`;
- `densityProfile`: exactly `full` or `simplified`;
- `motionProfile`: exactly `full` or `reduced`; and
- reducer-derived `scenePhase`: exactly `pre_choice`, `action`, `resolved`, or `meaning_support`, where only a current issued capability can select a value other than `pre_choice`.

There is no generic `profile`, `worldState`, or caller-owned `scenePhase` prop. Task 6's gallery translates its URL controls into the three independent axes and obtains later phase state only by replaying a committed reducer fixture; it may not pass `profile=full`, `state=repair/transfer`, or a phase string into Task 4.

`SOUND_SEEKERS_ROUTE_SPECS` contains exactly one record per Task 1 stop:

~~~js
{
  id: "route:s20",
  stopId: "s20",
  chapterId: "forge-settlement",
  topologyId,
  materialTokenId,
  pathGeometryId: "route-geometry:s20",
  viewBox: [0, 0, 1600, 900],
  taskCamera: { subjectZone, quietZone }
}
~~~

The nth stop in each canonical chapter copies the nth canonical `routeTopologies` value; no array-position join is accepted until stop and chapter IDs also match. `pathGeometryId` is the one shared painted/actor/collision/camera route coordinate identity for the later runtime; Task 4 must not publish divergent decorative and walkable paths.

`SOUND_SEEKERS_LANDMARK_BINDINGS` contains exactly one record per expedition payoff:

~~~js
{
  id: "landmark:s20",
  stopId: "s20",
  chapterId: "forge-settlement",
  repairId,
  sceneId,
  sceneVisualId,
  initialStateId,
  postDecisionBindings: [
    {
      postDecisionSemanticId,
      storyOutcomeId,
      actionStateId,
      resolvedStateId,
      consequenceId
    }
  ],
  stateVisuals: {
    [initialStateId]: { shapeId, partCount, patternId, accessibleLabel },
    // one entry for every distinct action/resolved/consequence state named above
    [postDecisionStateId]: { shapeId, partCount, patternId, accessibleLabel }
  }
}
~~~

The 40 records bijectively match exact Task 1 stop/repair identities and all 48 exact Task 3 post-decision/state/consequence identities. `postDecisionBindings` is in the scene link's canonical `postDecisionSemanticIds` order: length one with `storyOutcomeId:null` for each assessed scene and length two with two distinct non-null story outcomes for each boss. Each boss binding's state tuple is branch-specific; there is no scene-wide boss state or consequence fallback. `stateVisuals` has exactly the union of `initialStateId` and every distinct action/resolved/consequence ID named by those bindings. `partCount` is a positive integer and state differentiation uses silhouette/shape, count, pattern, and accessible label as well as color. `<Landmark>` accepts only the initial state or a state from the one capability-selected binding and fails closed otherwise. A consequence equal to that binding's resolved state reuses the same resolved visual; it does not create a false extra state.

**Unified cast and customization authority:**

`SOUND_SEEKERS_POSE_IDS` is the exact frozen order:

~~~js
[
  "idle", "walk", "explain", "encourage", "anticipate",
  "contact", "repair", "react", "celebrate", "recover"
]
~~~

`SOUND_SEEKERS_POSE_RENDERERS` is a ten-record frozen registry. Every record has this exact code-native composition shape; all numeric transform values are finite and bounded by the shared character viewBox:

~~~js
{
  id: "pose:repair",
  poseId: "repair",
  transforms: {
    torso: { x, y, rotate, scaleX, scaleY },
    head: { x, y, rotate, scaleX, scaleY },
    leftArm: { shoulder, elbow, hand },
    rightArm: { shoulder, elbow, hand },
    leftLeg: { hip, knee, foot },
    rightLeg: { hip, knee, foot }
  },
  face: { eyesId, browsId, mouthId },
  anchors: {
    back: { x, y, rotate }, head: { x, y, rotate },
    neck: { x, y, rotate }, held: { x, y, rotate },
    contact: { x, y }
  },
  fullMotionId: "pose-motion:repair-contact",
  reducedReplacement: {
    transition: "outline-opacity-static-final",
    finalPoseId: "repair",
    continuous: false
  }
}
~~~

The renderer always composes the same code-native body, face, limb, feature, role-prop, and accessory layers; a pose supplies transforms/expressions only. A pose record may not contain an image path, whole-character replacement, JSX, CSS, or character-specific part. `poseCompositionSignature()` removes IDs and motion labels and hashes transforms, face, anchors, and reduced final state. All ten signatures are distinct. `walk`, `explain`, `encourage`, `anticipate`, `contact`, `repair`, `react`, `celebrate`, and `recover` each differ from `idle` and from one another in at least one limb/head/face/contact-anchor field; `contact` and `repair` have distinct contact/held geometry. Every reduced replacement resolves to the same semantic final pose without continuous motion.

`SOUND_SEEKERS_CHARACTER_VISUALS` is Task 4's sole visual cast catalog. It is derived bijectively from `SOUND_SEEKERS_CHAPTERS` and checked against all eight pure Task 3 arcs. It has 32 records and no `player` record. A record contains exactly `characterId`, `chapterId`, `castKind` (`guide` or `resident`), `styleId: "sound-seekers-painted-shape-v2"`, `bodyShapeId`, `paletteTokenId`, `featureIds`, `rolePropId`, `gearAnchorIds`, `poseRendererIds`, and `visualSignature`. It never duplicates a name, role, archetype, or arc. Exact character IDs are canonical names, and all 32 visual signatures are unique. `visualSignature` is recomputed from normalized structural substance rather than trusted as authored text; a renamed or palette-only clone collides. `gearAnchorIds` has exactly `back`, `head`, `neck`, and `held`. `poseRendererIds` has exactly all ten pose keys and maps them bijectively to `SOUND_SEEKERS_POSE_RENDERERS`; duplicate/missing/unknown renderer IDs fail.

`SOUND_SEEKERS_PLAYER_VISUAL` is separate from the 32 canonical cast characters but uses that identical style, proportions, face placement, outline, material tokens, anchors, and pose vocabulary. Customization is cosmetic only. The exact normalized appearance is:

~~~js
{
  schemaVersion: 1,
  bodyShapeId,
  paletteTokenId,
  accessories: {
    back: nullOrAllowlistedId,
    head: nullOrAllowlistedId,
    neck: nullOrAllowlistedId,
    held: nullOrAllowlistedId
  }
}
~~~

`createCharacterAppearance()` rejects missing/extra keys, unknown IDs, an accessory in the wrong slot, duplicate IDs, and non-null non-string values, then recursively freezes the exact object. Serialization uses the shown stable key/slot order; deserialization accepts only that canonical JSON and returns the same normalized object/signature. All four non-null slots render simultaneously with back behind body, head/neck above it, and held at the hand. No prioritized single outfit or pre-rendered whole-character replacement is permitted. Creator preview and world both call `<SoundSeekersCharacter>` with the same normalized object and must render the same `data-appearance-signature`. Appearance cannot affect content, challenge selection, evidence, support, difficulty, reward, or route state.

`SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS` is the one recursively frozen iterable creator authority. It has exact shape `{bodyShapes, palettes, accessoriesBySlot:{back,head,neck,held}}`. `bodyShapes` and `palettes` preserve the canonical authoring order of the same internal allowlists used by `createCharacterAppearance()`; each accessory array begins with `null` for “none” and then contains every ID from that slot's one validation allowlist exactly once in canonical authoring order. There is no separate UI/gallery list, inferred option, cross-slot accessory, duplicate, or unavailable ID. `<SoundSeekersCharacterCreator>` and Task 6 import this export directly.

**Accessibility and child-size semantic visuals:**
- Every option/interactable semantic descriptor declares `minCssPx: 56`, uses a native button or equivalent native activation supplied by `SceneVisual`, has at least 8 CSS px clear separation from adjacent primary controls, and takes its visible child label and accessible name only from the Task 3 child view. Pointer, touch, Enter, and Space call the same `onChoose(option.token)` path; no action is drag-, hover-, motion-, or sound-only.
- Decorative layers are not focusable and are `aria-hidden`. Meaningful noninteractive art uses `role="img"` plus concise child-facing text; internal semantic IDs may appear in test/data attributes but never as visible or accessible child copy.
- Focus is persistently visible. Token pairs meet at least 4.5:1 for normal text and 3:1 for focus/interactive boundaries. Selection, current landmark state, success, retry, and focus use shape, outline, label/icon, pattern, and state placement in addition to color.
- At 320 CSS px and 200% zoom, the scene keeps its route, resident, current semantic object, prompt/label, and one clear next action. Task 4 unit/SSR tests prove the semantic markup and profile contracts; Task 6 owns exhaustive rendered viewport/input/browser evidence.
- `motionProfile: "reduced"` removes continuous/nonessential motion and uses the declared outline/opacity/static final state. `densityProfile: "simplified"` removes decoration only. Neither changes the child option set, state identity, learning meaning, labels, feedback, or reward.

- [ ] **Step 1: Write failing pure identity, count, join, leakage, art-authority, and profile tests**

`soundSeekersBiomeKits.test.js` and `soundSeekersSceneVisualCatalog.test.js` import pure modules directly. Tests must include at least:

~~~js
const EXPECTED_TASK5_HANDOFFS = Object.freeze([
  Object.freeze({
    id: "seedwake-meadow",
    src: "/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp",
    provenanceId: "ssv2-seedwake-meadow-bg",
    environmentDescription: "Dawn pasture, living hedges, warm wood, distant seed-lantern glow, pale gold and fresh green; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["dawn pasture", "living hedges", "distant windmill lantern silhouette"]),
    backdropReviewSemanticIds: Object.freeze(["dawn-pasture", "living-hedge-depth", "windmill-lantern-silhouette"])
  }),
  Object.freeze({
    id: "river-gardens",
    src: "/game-assets/sound-seekers/v2/biomes/river-gardens/background.webp",
    provenanceId: "ssv2-river-gardens-bg",
    environmentDescription: "Terraced water channels, reeds, ceramic garden markers, turquoise and terracotta; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["terraced water channels", "reed banks", "distant ceramic terrace markers"]),
    backdropReviewSemanticIds: Object.freeze(["terraced-water-channels", "reed-bank-depth", "ceramic-terrace-markers"])
  }),
  Object.freeze({
    id: "fossil-canyon",
    src: "/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp",
    provenanceId: "ssv2-fossil-canyon-bg",
    environmentDescription: "Layered sandstone shelves, ancient tracks, bone arches and amber afternoon depth; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["layered sandstone shelves", "ancient track bed", "distant bone arch"]),
    backdropReviewSemanticIds: Object.freeze(["layered-sandstone-shelves", "ancient-track-bed", "bone-arch"])
  }),
  Object.freeze({
    id: "forge-settlement",
    src: "/game-assets/sound-seekers/v2/biomes/forge-settlement/background.webp",
    provenanceId: "ssv2-forge-settlement-bg",
    environmentDescription: "Dark-stone workshops, distant furnace architecture, copper-and-iron depth and controlled ember light; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["distant furnace architecture", "dark-stone workshops", "copper rail depth"]),
    backdropReviewSemanticIds: Object.freeze(["furnace", "dark-stone-workshops", "copper-rail-depth"])
  }),
  Object.freeze({
    id: "glass-marsh",
    src: "/game-assets/sound-seekers/v2/biomes/glass-marsh/background.webp",
    provenanceId: "ssv2-glass-marsh-bg",
    environmentDescription: "Reflective jade pools, glass-reed depth, mist and refracted distant paths; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["reflective jade pools", "distant glass reeds", "mist path depth"]),
    backdropReviewSemanticIds: Object.freeze(["reflective-jade-pools", "glass-reed-depth", "mist-path-depth"])
  }),
  Object.freeze({
    id: "storm-coast",
    src: "/game-assets/sound-seekers/v2/biomes/storm-coast/background.webp",
    provenanceId: "ssv2-storm-coast-bg",
    environmentDescription: "Sea cliffs, spray, distant timber shelters and a storm clearing toward warm light; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["sea cliffs", "distant timber shelters", "storm clearing toward warm light"]),
    backdropReviewSemanticIds: Object.freeze(["sea-cliff", "timber-shelter-depth", "clearing-storm"])
  }),
  Object.freeze({
    id: "lantern-forest",
    src: "/game-assets/sound-seekers/v2/biomes/lantern-forest/background.webp",
    provenanceId: "ssv2-lantern-forest-bg",
    environmentDescription: "Deep layered woods, root-bridge depth, distant hanging lantern path, moss and muted gold; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["deep layered woods", "distant root bridges", "distant hanging lantern path"]),
    backdropReviewSemanticIds: Object.freeze(["deep-wood-layers", "root-bridge-depth", "hanging-lantern-path"])
  }),
  Object.freeze({
    id: "star-reach",
    src: "/game-assets/sound-seekers/v2/biomes/star-reach/background.webp",
    provenanceId: "ssv2-star-reach-bg",
    environmentDescription: "High observatory terraces, distant comet stairs, night sky, indigo and warm starlight; quiet lower-middle lane.",
    requiredBackdropElements: Object.freeze(["high observatory terraces", "distant comet stairs", "night sky"]),
    backdropReviewSemanticIds: Object.freeze(["observatory", "comet-stair-depth", "night-sky"])
  })
]);

test("eight kits hand exactly eight immutable backgrounds to Task 5", () => {
  assert.equal(SOUND_SEEKERS_BIOME_KITS.length, 8);
  assertRecursivelyFrozen(SOUND_SEEKERS_BIOME_KITS);
  assertRecursivelyFrozen(EXPECTED_TASK5_HANDOFFS);
  const actual = SOUND_SEEKERS_BIOME_KITS.map(kit => ({
    id: kit.id,
    src: kit.background.src,
    provenanceId: kit.background.provenanceId,
    environmentDescription: kit.backgroundGenerationBrief.environmentDescription,
    requiredBackdropElements: kit.backgroundGenerationBrief.requiredBackdropElements,
    backdropReviewSemanticIds: kit.backdropReviewSemanticIds
  }));
  assert.deepEqual(actual, EXPECTED_TASK5_HANDOFFS);
  assert.deepEqual(actual.map(item => item.id), SOUND_SEEKERS_CHAPTERS.map(chapter => chapter.id));
  for (const kit of SOUND_SEEKERS_BIOME_KITS) {
    assert.deepEqual(kit.background.expectedAspect, [16, 9]);
    assert.deepEqual(kit.background.minSize, [1536, 864]);
    assert.deepEqual(
      Object.fromEntries(Object.entries(kit.background.cropProfiles)
        .map(([id, profile]) => [id, profile.targetSize])),
      { landscape: [568, 320], tablet: [1194, 834], portrait: [320, 568] }
    );
    for (const profile of Object.values(kit.background.cropProfiles)) {
      assert.equal(Object.hasOwn(profile, "targetAspect"), false);
      const retained = computeBackgroundCrop({
        sourceSize: [1536, 864],
        targetSize: profile.targetSize,
        focalPoint: profile.focalPoint
      });
      assertRetainedRectangleIsExactAndContainsQuietZone(retained, profile.quietZone);
    }
    assertBackgroundCropRetainsQuietZones(kit.background, computeBackgroundCrop);
    assert.equal(kit.backgroundGenerationBrief.styleId, "sound-seekers-painted-shape-v2");
    assert.deepEqual(kit.backgroundGenerationBrief.forbiddenContent, [
      "characters", "interactive objects", "interface", "letters", "words",
      "logos", "watermarks", "borders"
    ]);
    assert.deepEqual(
      kit.backgroundGenerationBrief.backdropReviewSemanticIds,
      kit.backdropReviewSemanticIds
    );
    assert.deepEqual(
      kit.backgroundGenerationBrief.forbiddenSemanticIds,
      kit.codeNativeSemanticIds
    );
    assert.equal(intersection(kit.backdropReviewSemanticIds, kit.codeNativeSemanticIds).length, 0);
    assertTypedLayerContract(kit);
  }
  assert.equal(new Set(SOUND_SEEKERS_BIOME_KITS.map(codeNativeBiomeSignature)).size, 8);
  assertEveryBiomePairDiffersOnTwoStructuralDimensions(SOUND_SEEKERS_BIOME_KITS);
});

test("contrast pairs meet their exact child-facing ratios", () => {
  assertRecursivelyFrozen(SOUND_SEEKERS_CONTRAST_PAIRS);
  assertAllUsedTextFocusAndInteractivePairsAreDeclared();
  for (const pair of SOUND_SEEKERS_CONTRAST_PAIRS) {
    assert.ok(contrastRatio(pair.foregroundTokenId, pair.backgroundTokenId) >= pair.minRatio);
    assert.ok(["normal_text", "focus_ring", "interactive_boundary", "state_outline"].includes(pair.use));
    assert.equal(pair.minRatio, pair.use === "normal_text" ? 4.5 : 3);
  }
});

test("forty Task 3 scenes and all child option visuals resolve exactly once", () => {
  assert.equal(SOUND_SEEKERS_SCENE_RENDER_SPECS.length, 40);
  assert.equal(SOUND_SEEKERS_ROUTE_SPECS.length, 40);
  assert.equal(SOUND_SEEKERS_LANDMARK_BINDINGS.length, 40);
  assert.equal(SOUND_SEEKERS_OPTION_VISUALS.length, 112);

  assert.deepEqual(
    SOUND_SEEKERS_SCENE_RENDER_SPECS.map(item => ({
      id: item.id, sceneId: item.sceneId, chapterId: item.chapterId,
      preChoiceSemanticId: item.preChoiceSemanticId,
      optionSemanticIds: item.optionSemanticIds,
      postDecisionSemanticIds: item.postDecisionSemanticIds
    })),
    SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.map(item => ({
      id: item.id, sceneId: item.sceneId, chapterId: item.chapterId,
      preChoiceSemanticId: item.preChoiceSemanticId,
      optionSemanticIds: item.optionSemanticIds,
      postDecisionSemanticIds: item.postDecisionSemanticIds
    }))
  );
  assert.deepEqual(
    SOUND_SEEKERS_OPTION_VISUALS.map(item => ({
      semanticId: item.semanticId, sceneId: item.sceneId,
      comparisonFamilyId: item.comparisonFamilyId,
      frameSemanticId: item.frameSemanticId, salienceTier: item.salienceTier
    })),
    SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS.map(item => ({
      semanticId: item.id, sceneId: item.sceneId,
      comparisonFamilyId: item.comparisonFamilyId,
      frameSemanticId: item.frameSemanticId, salienceTier: item.salienceTier
    }))
  );

  const expectedRoutes = SOUND_SEEKERS_CHAPTERS.flatMap(chapter =>
    chapter.stopIds.map((stopId, index) => ({
      id: `route:${stopId}`, stopId, chapterId: chapter.id,
      topologyId: chapter.routeTopologies[index],
      pathGeometryId: `route-geometry:${stopId}`
    }))
  );
  assert.deepEqual(SOUND_SEEKERS_ROUTE_SPECS.map(route => ({
    id: route.id, stopId: route.stopId, chapterId: route.chapterId,
    topologyId: route.topologyId, pathGeometryId: route.pathGeometryId
  })), expectedRoutes);

  const expectedLandmarks = SOUND_SEEKERS_EXPEDITIONS.map(expedition => {
    const scene = getSceneVisualSemantics(expedition.connectedTextId);
    const pre = resolveSceneVisualSemantic(scene.preChoiceSemanticId);
    const postDecisionBindings = scene.postDecisionSemanticIds.map(semanticId => {
      const post = resolveSceneVisualSemantic(semanticId);
      return {
        postDecisionSemanticId: post.id,
        storyOutcomeId: post.storyOutcomeId,
        actionStateId: post.actionStateId,
        resolvedStateId: post.resolvedStateId,
        consequenceId: post.consequenceId
      };
    });
    return {
      id: `landmark:${expedition.stopId}`, stopId: expedition.stopId,
      chapterId: expedition.chapterId, repairId: expedition.payoff.repairId,
      sceneId: scene.sceneId, sceneVisualId: scene.id,
      initialStateId: pre.neutralStateId, postDecisionBindings
    };
  });
  assert.deepEqual(SOUND_SEEKERS_LANDMARK_BINDINGS.map(binding => ({
    id: binding.id, stopId: binding.stopId, chapterId: binding.chapterId,
    repairId: binding.repairId, sceneId: binding.sceneId,
    sceneVisualId: binding.sceneVisualId, initialStateId: binding.initialStateId,
    postDecisionBindings: binding.postDecisionBindings
  })), expectedLandmarks);
  assert.equal(
    SOUND_SEEKERS_LANDMARK_BINDINGS.reduce(
      (count, binding) => count + binding.postDecisionBindings.length, 0
    ),
    48
  );
  for (const binding of SOUND_SEEKERS_LANDMARK_BINDINGS) {
    const isBoss = binding.postDecisionBindings.length === 2;
    assert.equal(binding.postDecisionBindings.length, isBoss ? 2 : 1);
    if (isBoss) {
      assert.equal(new Set(binding.postDecisionBindings.map(item => item.storyOutcomeId)).size, 2);
      assert.equal(new Set(binding.postDecisionBindings.map(item => JSON.stringify([
        item.actionStateId, item.resolvedStateId, item.consequenceId
      ]))).size, 2);
    } else {
      assert.equal(binding.postDecisionBindings[0].storyOutcomeId, null);
    }
  }
});

test("meaning visuals preserve Task 3's one direct semantic namespace", () => {
  const exactWords = [...new Set([
    ...REQUIRED_ACTION_MEANING_WORD_IDS, ...ADVANCED_SCENE_TOKEN_IDS
  ])].sort();
  assert.deepEqual(
    SOUND_SEEKERS_MEANING_VISUALS.map(item => ({ semanticId: item.semanticId, wordId: item.wordId })),
    SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.map(item => ({ semanticId: item.id, wordId: item.wordId }))
  );
  assert.deepEqual(SOUND_SEEKERS_MEANING_VISUALS.map(item => item.wordId).sort(), exactWords);
  for (const visual of SOUND_SEEKERS_MEANING_VISUALS) {
    const support = getMeaningSupport(visual.wordId);
    assert.equal(visual.semanticId, support.visualSemanticId);
    assert.equal(resolveSceneVisualSemantic(visual.semanticId).wordId, visual.wordId);
  }
  assertNoMeaningAliasFieldsInTask4Sources();
});

test("every meaning is reachable through its canonical scene and real reducer-issued access", () => {
  for (const owner of SOUND_SEEKERS_MEANING_VISUAL_OWNERS) {
    const branch = SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.find(
      item => item.sceneId === owner.sceneId &&
        item.postDecisionSemanticId === owner.postDecisionSemanticId
    );
    const fixture = completePresentationForVisualTest(owner.sceneId, {
      narrativeChoiceToken: branch?.token ?? null
    });
    assert.equal(fixture.actionTransition.postDecisionSemanticId,
      owner.postDecisionSemanticId);
    const resolved = reduceConnectedTextPresentation(fixture.actionPresentation, {
      type: "action_completed", reducerRevision: fixture.actionPresentation.reducerRevision
    }, { state: fixture.state });
    const meaning = reduceConnectedTextPresentation(resolved.nextPresentation, {
      type: "meaning_requested",
      reducerRevision: resolved.nextPresentation.reducerRevision,
      meaningSemanticId: owner.meaningSemanticId
    }, { state: fixture.state });
    const context = {
      sceneId: owner.sceneId,
      attemptId: fixture.attemptId,
      reducerRevision: meaning.transition.reducerRevision
    };
    const access = issueSceneVisualAccess(meaning.transition, context);
    assert.equal(validateSceneVisualAccess(access, context), true);
    assert.equal(access.postDecisionSemanticId, owner.postDecisionSemanticId);
    assert.equal(access.meaningSemanticId, owner.meaningSemanticId);
    const view = resolveSceneVisualPresentation(
      toChildConnectedTextScene(owner.sceneId, "meaning-owner"), {
        activeAttemptId: fixture.attemptId,
        reducerRevision: meaning.transition.reducerRevision,
        sceneAccess: access
      }
    );
    assert.equal(view.scenePhase, "meaning_support");
    assert.equal(view.meaningVisual.semanticId, owner.meaningSemanticId);
  }
});

test("pre-choice rendering is answer-neutral for every child scene and seed", () => {
  for (const semantics of SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS) {
    const pre = resolveSceneVisualSemantic(semantics.preChoiceSemanticId);
    const posts = semantics.postDecisionSemanticIds.map(resolveSceneVisualSemantic);
    const bySemanticId = new Map();
    for (const routeSeed of ["seed-a", "seed-b", "seed-c"]) {
      const childScene = toChildConnectedTextScene(semantics.sceneId, routeSeed);
      const view = resolveSceneVisualPresentation(childScene, {
        activeAttemptId: `attempt:${semantics.sceneId}`,
        reducerRevision: 1,
        sceneAccess: null
      });
      assert.equal(view.scenePhase, "pre_choice");
      assert.equal(view.visualStateId, pre.neutralStateId);
      assert.equal(view.meaningVisual, null);
      assert.deepEqual(view.focalProps.map(item => item.semanticId), pre.neutralPropIds);
      assert.deepEqual(
        view.options.map(item => item.semanticId),
        childScene.choice.options.map(item => item.visualSemanticId)
      );
      assert.deepEqual(new Set(view.options.map(item => JSON.stringify(item.affordance))), new Set([
        JSON.stringify({ minCssPx: 56, frameTokenId: "choice-neutral", emphasisRank: 0, motionCueId: null })
      ]));
      for (const option of view.options) {
        const normalized = normalizedPeerRenderer(option);
        if (bySemanticId.has(option.semanticId)) {
          assert.deepEqual(normalized, bySemanticId.get(option.semanticId));
        } else {
          bySemanticId.set(option.semanticId, normalized);
        }
      }
      const serialized = JSON.stringify(view);
      for (const post of posts) {
        assert.equal(serialized.includes(post.id), false);
        assert.equal(serialized.includes(post.actionStateId), false);
        assert.equal(serialized.includes(post.resolvedStateId), false);
        assert.equal(serialized.includes(post.consequenceId), false);
        if (post.storyOutcomeId !== null) {
          assert.equal(serialized.includes(post.storyOutcomeId), false);
        }
        for (const id of post.meaningSemanticIds) assert.equal(serialized.includes(id), false);
      }
      assertNoCorrectnessOrEvidenceFields(view);
    }
  }
});

test("the visual cast is a bijective 32 plus a separate player", () => {
  const canonical = SOUND_SEEKERS_CHAPTERS.flatMap(chapter => [
    {
      characterId: chapter.cast.guide.name, chapterId: chapter.id,
      castKind: "guide", role: chapter.cast.guide.role,
      archetype: chapter.cast.guide.archetype
    },
    ...chapter.cast.residents.map(item => ({
      characterId: item.name, chapterId: chapter.id, castKind: "resident",
      role: item.role, archetype: item.archetype
    }))
  ]);
  assert.equal(SOUND_SEEKERS_CHARACTER_VISUALS.length, 32);
  assert.deepEqual(
    SOUND_SEEKERS_CHARACTER_VISUALS.map(item => ({
      characterId: item.characterId, chapterId: item.chapterId,
      castKind: item.castKind
    })),
    canonical.map(({ characterId, chapterId, castKind }) => ({ characterId, chapterId, castKind }))
  );
  assertCastArcIdentityJoinIsExact(SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_CAST_ARCS);
  assert.equal(new Set(SOUND_SEEKERS_CHARACTER_VISUALS.map(characterVisualSignature)).size, 32);
  assert.equal(SOUND_SEEKERS_PLAYER_VISUAL.characterId, "player");
  assert.deepEqual(SOUND_SEEKERS_POSE_IDS, [
    "idle", "walk", "explain", "encourage", "anticipate",
    "contact", "repair", "react", "celebrate", "recover"
  ]);
  assert.equal(SOUND_SEEKERS_POSE_RENDERERS.length, 10);
  assert.deepEqual(SOUND_SEEKERS_POSE_RENDERERS.map(item => item.poseId), SOUND_SEEKERS_POSE_IDS);
  assert.equal(new Set(SOUND_SEEKERS_POSE_RENDERERS.map(poseCompositionSignature)).size, 10);
  for (const visual of [...SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_PLAYER_VISUAL]) {
    assert.deepEqual(Object.keys(visual.gearAnchorIds).sort(), ["back", "head", "held", "neck"]);
    assert.deepEqual(Object.keys(visual.poseRendererIds), SOUND_SEEKERS_POSE_IDS);
    assert.deepEqual(
      Object.values(visual.poseRendererIds),
      SOUND_SEEKERS_POSE_RENDERERS.map(item => item.id)
    );
  }
  assertEveryPoseHasBoundedCompositionAndStaticReducedReplacement(SOUND_SEEKERS_POSE_RENDERERS);
});

test("creator options are the frozen iterable validation authority", () => {
  assertRecursivelyFrozen(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS);
  assert.deepEqual(Object.keys(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS), [
    "bodyShapes", "palettes", "accessoriesBySlot"
  ]);
  assert.deepEqual(
    Object.keys(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot),
    ["back", "head", "neck", "held"]
  );
  assertCreatorOptionsExactlyEqualValidationAllowlists(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS);
  for (const bodyShapeId of SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes) {
    for (const paletteTokenId of SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes) {
      for (const [slot, options] of Object.entries(
        SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot
      )) {
        for (const accessoryId of options) {
          const accessories = { back: null, head: null, neck: null, held: null };
          accessories[slot] = accessoryId;
          const appearance = createCharacterAppearance({
            schemaVersion: 1, bodyShapeId, paletteTokenId, accessories
          });
          const serialized = serializeCharacterAppearance(appearance);
          const resumed = deserializeCharacterAppearance(serialized);
          assert.deepEqual(resumed, appearance);
          assert.equal(appearanceSignature(resumed), appearanceSignature(appearance));
        }
      }
    }
  }
});
~~~

The pure validator tests pass cloned catalogs into the same validation functions used at module initialization. Mutations must independently reject: a swapped scene/chapter; an array-position join with a wrong scene ID; a missing/duplicate pre-choice, option, post-decision, or meaning record; an assessed scene with other than one post-decision join; a boss with other than its two canonical branch-specific joins, swapped branch order, a duplicate story outcome/state tuple, or a scene-wide fallback; an option moved to another scene; a changed comparison family/frame/salience; an option renderer whose neutral affordance, scale, outline, motion, or frame differs from its peers; a route with a swapped stop/chapter/topology or a decorative `pathGeometryId` different from the actor/collision/camera ID; a landmark with a swapped repair/scene/post-decision/story-outcome/state/consequence binding; duplicate `(stopId,repairId)` ownership; a cast ID with changed case, chapter, `castKind`, or missing/mismatched Task 3 arc identity; a literal `visualSignature` that disagrees with the derived structural signature; an unknown or duplicate pose renderer; two pose IDs normalized to the same composition; a palette/background/ID-only biome clone; a missing Task 5 brief field or reordered backdrop element; a non-frozen nested object; a crop whose computed retained rectangle clips one quiet-zone corner; an undeclared or sub-threshold contrast pair; and any source/descriptor field named `meaningSupportAnchorId`, `meaningSupportAnchorIds`, `anchorId`, or `meaningVisualSemanticId`.

`soundSeekersSceneVisualCatalog.test.js` also parses every static and dynamic import in the seven dependency-bound modules, canonicalizes it to the exact edge table above, deep-compares the complete edge set, and performs a topological sort. Adding `sceneVisualCatalog.js -> biomeKits.js`, `characterCatalog.js -> sceneVisualCatalog.js`, a renderer import, an answer-key import, or any other omitted edge fails even if Vite happens to tolerate the cycle.

Also scan every Task 4 production source and fail on:
- an import of Task 3 private/raw connected-text or answer-key modules;
- an import or call of `issueSceneVisualAccess` from a renderer/component; production components may import only `validateSceneVisualAccess`, while reducer integration and test fixtures own issuance;
- a validator that does not retain the exact source transition privately and re-run both Task 3 exact-current identity predicates on every access check, or any exported access/transition registry;
- a `connected_text_presentation_transition`, `connected_text_decision_committed`, or `narrative_bridge_committed` object literal anywhere in Task 4, or any `correct`/`isCorrect` argument supplied to issuance;
- `correct`, `correctness`, `isCorrect`, `isKey`, `expectedToken`, `distractorRationale`, rationale/correction/misconception, score, feedback, or answer-index fields in a visual descriptor;
- `meaningSupportAnchorId`, `meaningSupportAnchorIds`, `anchorId`, `meaningVisualSemanticId`, or another meaning alias/binding namespace;
- Phaser, Three.js, legacy pixel/book-character/creature-palette imports or legacy raster URL prefixes;
- any raster URL other than the exact eight declared backgrounds;
- any raw color outside `visualTokens.js`;
- an ambiguous `profile`/`worldState` API;
- a pose record containing a raster path, whole-character replacement, JSX, CSS, or character-specific parts;
- duplicate/missing/orphan semantic IDs, generic unresolved `dormant/repaired` state aliases, or a child-facing internal ID; and
- a simplified/reduced contract that removes an essential semantic ID or lacks a reduced replacement.

`soundSeekersSceneVisualAccess.test.js` exercises the real issuer and validator. Its test-local `completePresentationForVisualTest(sceneId,options)` starts from `createSoundSeekersState()`, calls the real Task 2 begin/checkpoint/fresh-attempt completion reducers with the canonical Task 3 assessed challenge or Task 2 `materializeBossTransferChallenge()`, begins and reduces the real Task 3 presentation, and returns the resulting complete state, canonically derived attempt ID, branded action presentation, and branded action transition. For a boss it requires one actual child-view narrative token and asserts that exact token appears on both final uses; it never retains that token as later authority. A companion `pendingIncorrectPresentationForVisualTest(sceneId)` performs one real wrong Task 2 response, verifies its valid receipt/correction, and reduces that evidence into the Task 3 correction transition. Neither helper returns a hand-authored transition or accepts a correctness argument:

~~~js
test("only a current Task 3 branded transition unlocks later semantics", () => {
  const fixture = completePresentationForVisualTest("scene-s1");
  const actionContext = Object.freeze({
    sceneId: "scene-s1", attemptId: fixture.attemptId,
    reducerRevision: fixture.actionTransition.reducerRevision
  });
  const actionAccess = issueSceneVisualAccess(fixture.actionTransition, actionContext);
  assert.equal(validateSceneVisualAccess(actionAccess, actionContext), true);
  const resolved = reduceConnectedTextPresentation(fixture.actionPresentation, {
    type: "action_completed", reducerRevision: fixture.actionPresentation.reducerRevision
  }, { state: fixture.state });
  assert.equal(isConnectedTextPresentationTransition(fixture.actionTransition), false);
  assert.equal(validateSceneVisualAccess(actionAccess, actionContext), false);
  assert.throws(() => issueSceneVisualAccess(fixture.actionTransition, actionContext));
  assert.throws(() => checkpointConnectedTextPresentation(fixture.actionPresentation));
  const context = Object.freeze({
    sceneId: "scene-s1", attemptId: fixture.attemptId,
    reducerRevision: resolved.transition.reducerRevision
  });
  const access = issueSceneVisualAccess(resolved.transition, context);
  assert.equal(validateSceneVisualAccess(access, context), true);
  assert.deepEqual(Object.keys(access), [
    "kind", "sceneId", "attemptId", "reducerRevision", "decisionId",
    "phase", "postDecisionSemanticId", "storyOutcomeId", "meaningSemanticId"
  ]);
  assert.equal(access.phase, "resolved");
  assert.equal(access.storyOutcomeId, null);
  assertNoCorrectnessOrEvidenceFields(access);

  for (const forged of [
    { ...access }, JSON.parse(JSON.stringify(access)), structuredClone(access)
  ]) {
    assert.equal(validateSceneVisualAccess(forged, { ...context, phase: "resolved" }), false);
  }
  for (const mismatch of [
    { ...context, sceneId: "scene-s2" },
    { ...context, attemptId: "attempt:scene-s1:old" },
    { ...context, reducerRevision: 8 },
    { ...context, phase: "resolved" }
  ]) {
    const mismatchAccess = issueSceneVisualAccess(resolved.transition, context);
    assert.equal(validateSceneVisualAccess(mismatchAccess, mismatch), false);
  }
  assert.throws(() => issueSceneVisualAccess(resolved.transition,
    { ...context, phase: "resolved" }));
  for (const forgedTransition of [
    { ...resolved.transition }, Object.freeze({ ...resolved.transition }),
    structuredClone(resolved.transition), JSON.parse(JSON.stringify(resolved.transition))
  ]) assert.throws(() => issueSceneVisualAccess(forgedTransition, context));
});

test("meaning and narrative access remain scene-bound and direct", () => {
  const assessed = completePresentationForVisualTest("scene-s1");
  const resolved = reduceConnectedTextPresentation(assessed.actionPresentation, {
    type: "action_completed", reducerRevision: assessed.actionPresentation.reducerRevision
  }, { state: assessed.state });
  const meaningTransition = reduceConnectedTextPresentation(resolved.nextPresentation, {
    type: "meaning_requested", reducerRevision: resolved.nextPresentation.reducerRevision,
    meaningSemanticId: "meaning-mat-flat-ground-cover"
  }, { state: assessed.state }).transition;
  const context = {
    sceneId: "scene-s1", attemptId: assessed.attemptId,
    reducerRevision: meaningTransition.reducerRevision
  };
  const meaning = issueSceneVisualAccess(meaningTransition, context);
  assert.equal(validateSceneVisualAccess(meaning, context), true);
  assert.equal(meaning.phase, "meaning_support");
  assert.equal(meaning.meaningSemanticId, "meaning-mat-flat-ground-cover");
  assert.throws(() => issueSceneVisualAccess(meaningTransition, {
    ...context, meaningSemanticId: "meaning-box-container"
  }));

  const bossScenes = SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.filter(
    item => item.postDecisionSemanticIds.length === 2
  );
  assert.equal(bossScenes.length, 8);
  const coveredBossPostDecisions = new Set();
  for (const semantics of bossScenes) {
    const branchResults = [];
    const bossOptions = toChildConnectedTextScene(
      semantics.sceneId, `visual-test:${semantics.sceneId}`
    ).choice.options;
    assert.equal(bossOptions.length, 2);
    for (const option of bossOptions) {
      const boss = completePresentationForVisualTest(semantics.sceneId, {
        narrativeChoiceToken: option.token
      });
      const expectedBranch = resolveNarrativeBranchOutcome(
        semantics.sceneId, option.token
      );
      const bossResolved = reduceConnectedTextPresentation(boss.actionPresentation, {
        type: "action_completed", reducerRevision: boss.actionPresentation.reducerRevision
      }, { state: boss.state });
      const narrativeContext = {
        sceneId: semantics.sceneId, attemptId: boss.attemptId,
        reducerRevision: bossResolved.transition.reducerRevision
      };
      const narrative = issueSceneVisualAccess(bossResolved.transition, narrativeContext);
      assert.equal(validateSceneVisualAccess(narrative, narrativeContext), true);
      assert.equal(narrative.storyOutcomeId, expectedBranch.storyOutcomeId);
      assert.equal(narrative.postDecisionSemanticId,
        expectedBranch.postDecisionSemanticId);

      const checkpoint = checkpointConnectedTextPresentation(bossResolved.nextPresentation);
      const resumed = rehydrateConnectedTextPresentation(boss.state,
        JSON.parse(JSON.stringify(checkpoint)));
      assert.notEqual(resumed.transition, bossResolved.transition);
      assert.equal(isConnectedTextPresentationTransition(bossResolved.transition), false);
      assert.equal(validateSceneVisualAccess(narrative, narrativeContext), false);
      const resumedContext = {
        ...narrativeContext, reducerRevision: resumed.transition.reducerRevision
      };
      const reissued = issueSceneVisualAccess(resumed.transition, resumedContext);
      assert.equal(validateSceneVisualAccess(reissued, resumedContext), true);
      assert.equal(reissued.storyOutcomeId, expectedBranch.storyOutcomeId);
      assert.equal(reissued.postDecisionSemanticId,
        expectedBranch.postDecisionSemanticId);
      branchResults.push([reissued.storyOutcomeId, reissued.postDecisionSemanticId]);
      coveredBossPostDecisions.add(reissued.postDecisionSemanticId);
      assert.equal(closeConnectedTextPresentation(resumed.presentation), true);
      assert.equal(validateSceneVisualAccess(reissued, resumedContext), false);
    }
    assert.equal(new Set(branchResults.map(item => JSON.stringify(item))).size, 2);
  }
  assert.equal(coveredBossPostDecisions.size, 16);

  const replaced = completePresentationForVisualTest("scene-s1");
  const replacedContext = {
    sceneId: "scene-s1", attemptId: replaced.attemptId,
    reducerRevision: replaced.actionTransition.reducerRevision
  };
  const replacedAccess = issueSceneVisualAccess(replaced.actionTransition, replacedContext);
  beginConnectedTextPresentation({ sceneId: "scene-s2", transactionId: "visual:replacement:s2" });
  assert.equal(isConnectedTextPresentationTransition(replaced.actionTransition), false);
  assert.equal(validateSceneVisualAccess(replacedAccess, replacedContext), false);
});

test("every real wrong story receipt remains correction-only with no Task 4 payoff", () => {
  for (const semantics of SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS) {
    const wrong = pendingIncorrectPresentationForVisualTest(semantics.sceneId);
    assert.equal(wrong.transition.phase, "correction");
    assert.equal(wrong.transition.correctionRecordId,
      wrong.receipt.correctionRecordIds[0]);
    assert.equal(wrong.transition.postDecisionSemanticId, null);
    assert.equal(wrong.transition.storyOutcomeId, null);
    assert.equal(wrong.transition.meaningSemanticId, null);
    assert.throws(() => issueSceneVisualAccess(wrong.transition, {
      sceneId: semantics.sceneId, attemptId: wrong.attemptId,
      reducerRevision: wrong.transition.reducerRevision
    }));
    const view = resolveSceneVisualPresentation(
      toChildConnectedTextScene(semantics.sceneId, "wrong-no-payoff"), {
        activeAttemptId: wrong.attemptId,
        reducerRevision: wrong.transition.reducerRevision,
        sceneAccess: null
      }
    );
    assert.equal(view.scenePhase, "pre_choice");
    assert.equal(view.meaningVisual, null);
    assert.equal(JSON.stringify(view).includes("storyOutcomeId"), false);
  }
});

test("background failure state is deterministic and rejects stale image events", () => {
  const first = createBackgroundImageState("/first.webp");
  const stale = reduceBackgroundImageState(first, { type: "failed", src: "/old.webp" });
  assert.equal(stale, first);
  const failed = reduceBackgroundImageState(first, { type: "failed", src: "/first.webp" });
  assert.deepEqual(failed, { src: "/first.webp", status: "failed", revision: 0 });
  assert.equal(reduceBackgroundImageState(failed, { type: "failed", src: "/first.webp" }), failed);
  const changed = reduceBackgroundImageState(failed, { type: "source_changed", src: "/second.webp" });
  assert.deepEqual(changed, { src: "/second.webp", status: "pending", revision: 1 });
  assert.equal(reduceBackgroundImageState(changed, { type: "loaded", src: "/first.webp" }), changed);
});
~~~

- [ ] **Step 2: Write Vite-SSR component, accessibility, fallback, pose, and customization tests**

`soundSeekersVisualSemantic.test.js` and `soundSeekersCharacterCreator.test.js` must start one middleware-mode Vite server in `test.before`, load JSX through `vite.ssrLoadModule()`, and close it in `test.after`. Do not import a JSX module directly through Node. Follow the repository's existing `tests/unit/authPage.test.js` pattern.

Render every one of the 40 child scenes at least once through the real `<SceneVisual>`/`<LayeredBiome>` tree and assert:
- exact scene/state/semantic data identities and no private/correctness fields in markup;
- 112 native option buttons in the aggregate, child labels/accessibility names from the child view, 56px semantic contract, one selection callback path, and equal neutral pre-choice affordances;
- pre-choice accepts no phase prop and contains no option prop/action outside its peer button and no post-decision action/result/consequence/direct-meaning ID;
- all 48 post-decision action/resolved renders—one for each assessed scene and both authenticated branches for every boss—and every direct-meaning render are driven by a real exact-current capability issued from a Task 3 branded transition produced after real Task 2 completion; every meaning-semantic registry entry is opened from its deterministic earliest scene-and-post-decision owner through `resolved -> meaning_requested` and rendered through the actual component; forged, cloned, stale, prior-revision, replaced-scene, closed, cross-scene, cross-attempt, wrong-phase, mismatched-story-outcome, and mismatched-meaning access renders fail closed to pre-choice or reject;
- every one of 40 landmarks at its initial state plus every one of the 48 joined post-decision bindings at action, resolved, and consequence state, with non-color shape/count/pattern/label changes and no scene-wide boss fallback;
- all 32 canonical cast characters plus player in all ten poses, with the shared body/face/limb/accessory part inventory and the exact derived pose-composition signature; one reference character's ten normalized pose subtrees are pairwise distinct;
- full/simplified and full/reduced profile retention/replacement;
- pending and failed `backgroundImageState` both retain the exact complete code-native route, resident, landmark/current state, option, focus, and label subtree with no loading gate;
- background/decorative art is hidden from accessibility APIs while meaningful art is named; and
- creator/world parity with simultaneous back, head, neck, and held accessories plus strict serialize/deserialize/signature round trips and rejection of malformed appearances.

The test-only Vite fixture imports and mounts those real Task 4 components with `toChildConnectedTextScene("scene-s1","fallback-browser-seed")`; it contains no alternate renderer or copied semantic data. `sound-seekers-visual-fallback.spec.js` proves a real browser load failure rather than simulating SSR behavior:

~~~js
test("an aborted decorative biome image keeps the complete interactive scene", async ({ page }) => {
  await page.route("**/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp", route => route.abort());
  await page.goto("/tests/fixtures/soundSeekersVisualHarness.html?scene=scene-s1");
  await expect(page.locator("[data-background-status='failed']")).toBeVisible();
  await expect(page.locator("[data-code-native-setting]")).toBeVisible();
  await expect(page.locator("[data-route-geometry='route-geometry:s1']")).toBeVisible();
  await expect(page.locator("[data-landmark-state]")).toBeVisible();
  await expect(page.locator("[data-character-id='Moss']")).toBeVisible();
  await expect(page.getByRole("button")).toHaveCount(3);
  await expect(page.locator("[data-scene-prompt]")).toBeVisible();
  await expect(page.locator("[data-scene-loading]")).toHaveCount(0);
  await expect(page.locator("img[data-biome-background]")).toHaveAttribute("aria-hidden", "true");
});
~~~

The browser fixture also tabs to each option, presses Enter and Space through the same `onChoose(token)` callback, and verifies the computed minimum width/height is at least 56 CSS px, adjacent primary-control gap is at least 8 CSS px, the focus indicator remains visible, and the image error does not change labels, option order, semantic IDs, or callback tokens. This is a deterministic single-browser component failure gate; Task 6 still owns the exhaustive viewport/input/browser matrix.

- [ ] **Step 3: Run the new tests and confirm the dependency-clean red state**

Run:

~~~bash
node --test tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersSceneVisualCatalog.test.js tests/unit/soundSeekersSceneVisualAccess.test.js tests/unit/soundSeekersVisualSemantic.test.js tests/unit/soundSeekersCharacterCreator.test.js
npx playwright test tests/browser/sound-seekers-visual-fallback.spec.js --project=desktop
~~~

Expected: FAIL because only the new Task 4 modules/components and real-component browser fixture are absent. A missing/uncommitted Task 1 or Task 3 export, a dirty dependency, or a failure in their focused suites is a dependency blocker, not permission to stub or weaken the contract.

- [ ] **Step 4: Implement pure catalogs, typed layers, semantic resolvers, and the unified code-native cast**

Implement the exact frozen catalogs and authoritative tuple joins above. Consume all five split Task 3 semantic arrays plus the unified registry directly. Remove every meaning alias/binding concept, keep neutral/option/post-decision data separated, and make every resolver fail closed. Implement the exact parsed-import graph and named-binding test, including the two-export-only Task 3 edge for `sceneVisualAccess.js`. Define every raw color once in `visualTokens.js`, export named tokens and checked contrast pairs, and inject matching CSS custom properties; other Task 4 files refer only to token IDs/variables. Author the literal recursively frozen eight-row background handoff from the exact table without creating an image, and reject normalized code-native biome reskins.

Build all scene, route, landmark, resident, peer-option, direct-meaning, and state visuals from code-native SVG/DOM/CSS primitives with a shared viewBox and visual language. Keep interactables at the strongest checked local contrast. Preserve one Task 1/Task 3 identity through every resolver rather than matching by display text or array position. Implement `sceneVisualAccess.js` as the branded-Task-3-transition, scene/attempt/exact-revision/generation-bound capability boundary and `resolveSceneVisualPresentation()` as its only visual consumer. A copied/serialized/forged/stale capability fails; validation rechecks the privately bound exact-current source transition every time. Advancing one revision, beginning another scene, closing, or resuming invalidates the old transition and access before any fresh issuance.

- [ ] **Step 5: Implement shared rendering, fallback, accessibility, profiles, and strict creator persistence**

Implement the real `SceneVisual` → `LayeredBiome`/`Landmark`/`SoundSeekersCharacter` component path. `SceneVisual` receives only the Task 3 child view plus current reducer context/capability, exposes one child-safe `onChoose(token)` callback, and does not create literacy evidence. Use native controls, visible tokenized focus, checked code-native text/outline contrast, and semantic labels. Keep raster background loading decorative; drive it through `backgroundImageState.js`, render the complete code-native scene unconditionally, and exercise a real aborted request in the test-only Vite browser fixture.

Implement the exact independent crop/density/motion axes; phase is derived only from reducer access. Use the one normalized crop solver with literal real-device `targetSize` values `[568,320]`, `[1194,834]`, and `[320,568]`; the solver derives each exact aspect internally and rejects an authored `targetAspect`. Implement the ten non-alias code-native pose compositions and their static reduced replacements, simultaneous gear layers, and strict versioned appearance persistence. The creator preview and world may change context metadata only; their visual subtree and signature remain identical.

- [ ] **Step 6: Run focused, dependency, static, build, and downstream-contract verification**

Run:

~~~bash
node --test tests/unit/soundSeekersExpeditions.test.js tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersConnectedTextPresentation.test.js tests/unit/soundSeekersContentTransactions.test.js tests/unit/soundSeekersMeaningSupport.test.js tests/unit/soundSeekersCastArcs.test.js
node --test tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersSceneVisualCatalog.test.js tests/unit/soundSeekersSceneVisualAccess.test.js tests/unit/soundSeekersVisualSemantic.test.js tests/unit/soundSeekersCharacterCreator.test.js
npx playwright test tests/browser/sound-seekers-visual-fallback.spec.js --project=desktop
npm run lint
npm run check:quest
~~~

Task 4 precedes the later screenshot tool, so run its production build in an independently created OS-temporary root and remove only that exact validated root in a failure-safe subshell:

~~~bash
(
  set -e
  task4_tmp_parent="$(node --input-type=module -e 'import {realpathSync} from "node:fs"; import {tmpdir} from "node:os"; process.stdout.write(realpathSync(tmpdir()))')"
  task4_build_root="$(mktemp -d "$task4_tmp_parent/lp-ss-task4-build.XXXXXX")"
  cleanup_task4_build_root() {
    node --input-type=module -e 'import {lstatSync,realpathSync,rmSync} from "node:fs"; import {basename,dirname} from "node:path"; import {tmpdir} from "node:os"; const root=process.argv[1]; const stat=lstatSync(root); if (realpathSync(dirname(root))!==realpathSync(tmpdir()) || !/^lp-ss-task4-build\.[A-Za-z0-9]+$/.test(basename(root)) || stat.isSymbolicLink() || !stat.isDirectory()) process.exit(2); rmSync(root,{recursive:true,force:false});' "$task4_build_root"
  }
  trap cleanup_task4_build_root EXIT INT TERM
  npx vite build --outDir "$task4_build_root/production"
  cleanup_task4_build_root
  trap - EXIT INT TERM
)
~~~

Require the exact temporary root to be absent afterward. Task 4 neither creates nor removes project `dist/` or `dist-quest-offline/`; record and compare any pre-existing directory's complete byte manifest before and after this build.

Expected: PASS with the literal recursively frozen eight-row handoff; exact 8 kits/40 scene specs/48 post-decision joins/40 routes/40 landmarks/32 cast plus player/112 options/direct-meaning counts; complete authoritative tuple ownership; exact acyclic imports including `sceneVisualCatalog.js -> sceneVisualAccess.js` for the validator and the two-name-only Task 3 transition edge into access; split answer-neutral child-view rendering; every later-phase fixture built through real Task 2 completion and the Task 3 branded reducer; all 32 assessed and all 16 boss-branch post-decision presentations with no boss fallback; forged/frozen/cloned/serialized/stale capability and transition rejection; WeakSet identity plus WeakMap source binding, resume revalidation/replay plus fresh issuance; ten resolvable non-alias poses; one frozen creator-options iterable with exhaustive canonical round trips; strict cosmetics; structurally distinct code-native biomes; computable retained crops; checked luminance contrast; deterministic state plus real-browser background failure; and no Task 5 file requirement. This is pure/unit/SSR plus one desktop-browser component-failure gate. It does not claim generated raster quality, exhaustive browser layout/input behavior, human visual approval, assistive-technology approval, physical-iPad readiness, or observed-child playability.

**Locked downstream handoff:** Task 5 receives exactly the literal eight `background` objects, eight immutable `backgroundGenerationBrief` objects, `backdropReviewSemanticIds`, and the shared `computeBackgroundCrop()` results for literal target sizes `[568,320]`, `[1194,834]`, and `[320,568]`; its prompt/provenance and human semantic review may cover those backdrop IDs only, never `codeNativeSemanticIds`. Task 6 must render the same Task 4 components with real Task 3 child views, direct Task 3 meaning semantic IDs, Task 3 branded presentation transitions, and the canonical `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS` iterable; it may not hard-code or derive creator IDs. It may select a later-phase fixture only by completing the real Task 2 transaction, reducing the Task 3 presentation, and obtaining a current capability from that exact branded transition. Resume must serialize only Task 2 state plus the strict Task 3 presentation checkpoint, then rehydrate/replay and issue anew; it may not retain capability objects, synthesize evidence, pass a phase string, forge access, or add a meaning alias. It translates gallery controls into crop/density/motion plus the reducer-derived phase, enumerates all eight kits, 40 scenes, 112 options, 40 routes/landmarks, 32 canonical cast characters plus player, all direct meaning refs, background failure, full/simplified, full/reduced, 320 CSS px, 200% zoom, keyboard/touch/pointer/focus, and no-answer-leak fixtures. Neither downstream task may invent a preview renderer, crop solver, target size, creator-option list, or second semantic catalog.

The later production runtime is also a required Task 3/4 consumer gate, not optional follow-up. `tests/unit/soundSeekersPlaythrough.test.js` must enter every authored Word Forge and Blend Bridge action, commit it through the real mission reducer, pause before the next action, call Task 3 `getMeaningSupport(action.wordId)`, and pass only its exact `visualSemanticId` to Task 4 `resolveMeaningVisual()`. It serializes and normalizes the complete v2 checkpoint immediately before and during each payoff, reloads, rederives the same support/visual join, and asserts matching `wordId`, reviewed child definition/action/contrast, identical semantic visual, zero added evidence/deck use/repair/reward, and no pre-success payoff. The same suite must reload a later relationship stop and prove its real resident renders Task 3 `getCastRelationshipBeat()`'s ordered repair-specific `callbackLines`; a lookup-only or serialize-only test does not satisfy either contract. `tests/unit/soundSeekersGameContract.test.js` must mount the real production orchestrator and exercise connected-text scene replacement, phase leave, route exit, and React unmount. Each path calls `closeConnectedTextPresentation()` on the exact active presentation before dropping it and proves the old Task 3 state/transition and Task 4 access immediately fail; a source scan, defensive `begin`, or test-only cleanup is not production lifecycle evidence.

- [ ] **Step 7: Stage only the exact Task 4 paths, inspect the boundary, and commit**

~~~bash
git add -A -- src/features/soundSeekers/content/biomeKits.js src/features/soundSeekers/visual/sceneVisualCatalog.js src/features/soundSeekers/visual/characterCatalog.js src/features/soundSeekers/visual/visualTokens.js src/features/soundSeekers/engine/sceneVisualAccess.js src/features/soundSeekers/visual/backgroundImageState.js src/features/soundSeekers/visual/LayeredBiome.jsx src/features/soundSeekers/visual/SceneVisual.jsx src/features/soundSeekers/visual/CharacterSystem.jsx src/features/soundSeekers/visual/characterCustomization.js src/features/soundSeekers/visual/CharacterCreator.jsx src/features/soundSeekers/visual/Landmark.jsx src/features/soundSeekers/visual/visual-system.css tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersSceneVisualCatalog.test.js tests/unit/soundSeekersSceneVisualAccess.test.js tests/unit/soundSeekersVisualSemantic.test.js tests/unit/soundSeekersCharacterCreator.test.js tests/fixtures/soundSeekersVisualHarness.html tests/fixtures/soundSeekersVisualHarness.jsx tests/browser/sound-seekers-visual-fallback.spec.js
git diff --cached --name-status
git diff --cached --check
git commit -m "feat: define Sound Seekers semantic visual system"
~~~

The cached list must contain exactly the 21 Task 4 paths above and nothing else. It must not contain this plan, a Task 1/3/5/6 implementation path, a public raster, a legacy visual/runtime path, an artifact, or an unreviewed approval edit. The two test-fixture files and one browser spec are test-only consumers of the real Task 4 components, never a preview renderer. Do not use a directory-wide `git add src/features/soundSeekers/visual`.

### Task 5: Generate, crop-review, optimize, and provenance-lock eight biome backgrounds

**Dependency and collision stop:** Do not begin Task 5 until the reviewed Task 4 commit exists and all five Task 4 unit suites (`soundSeekersBiomeKits`, `soundSeekersSceneVisualCatalog`, `soundSeekersSceneVisualAccess`, `soundSeekersVisualSemantic`, and `soundSeekersCharacterCreator`) plus `sound-seekers-visual-fallback.spec.js` pass at that commit. Its exact eight frozen biome/background contracts and one crop solver must import without a Task 5 file. Confirm that all 15 Task 5 paths below, including `package.json`, are clean and that no other active task owns them. The public `v2` root must not already exist as a file, directory, or symlink. If Task 4 is missing/uncommitted, a required suite is not green, a scoped path is dirty, the public root exists, or an active task overlaps, stop and report Task 5 blocked; do not stub Task 4, overwrite an asset, generate an image, or widen this task.

**Files:**
- Create: `public/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp`
- Create: `public/game-assets/sound-seekers/v2/biomes/river-gardens/background.webp`
- Create: `public/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp`
- Create: `public/game-assets/sound-seekers/v2/biomes/forge-settlement/background.webp`
- Create: `public/game-assets/sound-seekers/v2/biomes/glass-marsh/background.webp`
- Create: `public/game-assets/sound-seekers/v2/biomes/storm-coast/background.webp`
- Create: `public/game-assets/sound-seekers/v2/biomes/lantern-forest/background.webp`
- Create: `public/game-assets/sound-seekers/v2/biomes/star-reach/background.webp`
- Create: `public/game-assets/sound-seekers/v2/SOURCE.md`
- Create: `tools/lib/soundSeekersV2AssetManifest.mjs`
- Create: `tools/prepareSoundSeekersV2Background.mjs`
- Create: `tools/buildSoundSeekersV2CropReview.mjs`
- Create: `tools/checkSoundSeekersV2Assets.mjs`
- Create: `tests/unit/soundSeekersAssetManifest.test.js`
- Modify: `package.json`

These are the exact 15 owned paths. Do not modify or stage `biomeKits.js`, a Task 4 visual module, a Task 6 file, `src/content/appVisualAssetReviews.generated.js`, `tools/recordAppVisualReview.mjs`, or an existing/legacy asset. Task 4's `background`, `backgroundGenerationBrief`, `backdropReviewSemanticIds`, `codeNativeSemanticIds`, focal points, and quiet zones are immutable Task 5 inputs. Task 5 creates no character, prop, landmark, option, grapheme, interface, or additional raster.

**Interfaces:**
- Consumes: the exact ordered `SOUND_SEEKERS_BIOME_KITS` output and `computeBackgroundCrop()` from Task 4, plus the current image-generation skill. The canonical generation order is `seedwake-meadow`, `river-gardens`, `fossil-canyon`, `forge-settlement`, `glass-marsh`, `storm-coast`, `lantern-forest`, `star-reach`.
- Produces: exactly eight unique, opaque, single-frame, sRGB WebPs at exactly 1536×864; one JSON-fenced SOURCE manifest; an ignored crash-safe terminal call ledger at `.artifacts/sound-seekers-v2/generation/calls.json`; a separate ignored atomic mutable preparation/review ledger at `.artifacts/sound-seekers-v2/generation/preparation.json`; exactly 24 deterministically reproducible crop-review panels plus a machine-readable review manifest under `.artifacts/sound-seekers-v2/crop-review/`; `SOUND_SEEKERS_V2_BACKGROUND_ORDER`, `SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY`, `buildSoundSeekersV2BackgroundPrompt(kit)`, `readSoundSeekersV2AssetManifest({root=process.cwd()}={})`, `assertSoundSeekersV2AssetManifest(manifest,kits)`, `assertSoundSeekersV2Assets({root=process.cwd(),kits=SOUND_SEEKERS_BIOME_KITS}={})`, and `npm run check:sound-seekers-assets`.
- Does not produce: a human approval, an offline/cache claim, a browser/fallback claim, a physical-device claim, a second biome catalog, or a retained generated source/rejected variant.

`SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY` is one recursively frozen Task 5 value used by all eight prompts. It contains no biome-specific nouns and fixes the image-generation taxonomy and art policy: `useCase: "stylized-concept"`, decorative early-literacy 2D game background, shape-led hand-painted storybook surfaces, restrained paper/gouache texture, rounded readable environmental silhouettes, consistent upper-left lighting, quiet depth, subdued play-space contrast, and a clear lower-middle lane. `compositionFraming` is exactly `Wide landscape source with one full-bleed 16:9 crop of at least 1536x864 usable pixels; clear lower-middle play lane; quiet depth; subdued play-space contrast.` This explicit source requirement supports the separate largest-integer 16:9 public transform; it is not a child-profile crop. Its exact `prohibitions` array is additive to Task 4's `forbiddenContent`: `characters`, `residents`, `route`, `landmark`, `state`, `reward`, `meaning`, `option`, `choice`, `interactable`, `interactive objects`, `collectible`, `grapheme plate`, `focus`, `feedback`, `interface`, `interface object`, `foreground action`, `isolated or highlighted choice`, `correctness cue`, `answer cue`, `text`, `letters`, `words`, `glyphs`, `numerals`, `signs`, `labels`, `alphabet-like marks`, `runes`, `logos`, `watermarks`, `borders`, `third-party characters`, `unsafe imagery`, and `high-contrast clutter in the play lane`.

`buildSoundSeekersV2BackgroundPrompt(kit)` is pure. It validates the frozen Task 4 joins, including `expectedAspect: [16,9]`, `minSize: [1536,864]`, and the three literal device `targetSize` pairs, then formats short labeled lines in this exact order: `Use case`, `Asset type`, `Primary request`, `Scene/backdrop`, `Style/medium`, `Composition/framing`, `Lighting/mood`, `Constraints`, `Avoid`. All biome-specific language comes only from `kit.backgroundGenerationBrief.environmentDescription` and its exact ordered `requiredBackdropElements`. The builder uses the shared style policy selected by the exact Task 4 `styleId`; it does not translate, embellish, or restate a biome block. It never includes a `codeNativeSemanticId`/`forbiddenSemanticId`, and the complete prompt plus the canonical SHA-256 of the full frozen Task 4 brief are recorded in provenance. Independent literal prompt snapshots and hashes in Step 1—not the production builder—are the executable prompt authority.

**Exact generation ceiling:** Task 5 has exactly eight immutable call ordinals in canonical order, one for each biome, and a clean uninterrupted run executes exactly one built-in `image_gen.imagegen` call for each ordinal. Each call is a brand-new generation with arguments exactly `{ prompt }`; omit `referenced_image_paths` and `num_last_images_to_include` rather than passing `null`. Do not use `n`, batch generation, an edit, a reference image, a targeted revision, a retry, or CLI/API fallback. Before the first call, create `calls.json` with all eight canonical entries in `planned` state and create the separate `preparation.json` with all eight stages `awaiting_call`. Immediately before an ordinal's call, atomically persist and fsync only its call-ledger `reserved` state; only then may that one call execute. A returned result becomes `succeeded`, a synchronously known tool failure becomes `failed`, and any `reserved` entry found after interruption becomes immutable `unknown`. `failed` and `unknown` both consume that ordinal, can never be called again, and block promotion; subsequent still-`planned` ordinals may each make their one call so the run records the complete eight-ordinal outcome. Finalization requires all eight call entries to be `succeeded` and the separate preparation entries to prove accepted candidates/crops. There is never a ninth ordinal or retry. A future recovery task requires fresh explicit scope; it is not a hidden continuation or fallback of this one.

**SOURCE schema:** `SOURCE.md` contains explanatory prose and exactly one fenced JSON object with exact top-level shape `{ schemaVersion: 2, project: "LiteracyPath Sound Seekers v2", generatorContract: "task4-immutable-background-brief-v1", assets: [...] }`. `assets` is in canonical generation order and has exactly eight records with no extra keys:

~~~js
{
  id,                    // exact Task 4 provenanceId
  chapterId,
  path,                  // exact Task 4 root-relative src
  task4: {
    briefSha256,         // canonical SHA-256 of the complete frozen brief
    styleId,
    requiredBackdropElements,
    backdropReviewSemanticIds,
    forbiddenSemanticIds
  },
  generation: {
    mode: "builtin_image_gen",
    tool: "image_gen.imagegen",
    callOrdinal,         // exact integer 1..8
    requestedAt,
    completedAt,
    prompt,
    promptSha256,
    resultMetadata: {    // exact safe committed projection; no raw hint or path
      returnedModel,     // exact returned string or null when the tool returns none
      outputHintSha256   // exact SHA-256 or null when no hint is returned
    },
    resultMetadataSha256 // canonical SHA-256 of resultMetadata
  },
  source: { format, width, height, sha256 },
  transform: {
    orientation: "auto",
    crop: { left, top, width, height, anchorProfile: "landscape" },
    resize: {
      width: 1536, height: 864, kernel: "lanczos3", withoutEnlargement: true
    },
    encode: {
      format: "webp",
      quality: 82,
      effort: 6,
      smartSubsample: true,
      metadata: "stripped",
      colourspace: "srgb",
      sharpVersion,
      libvipsVersion,
      doubleEncodeSha256
    }
  },
  final: {
    format: "webp", width: 1536, height: 864,
    byteLength, sha256, opaque: true, pages: 1
  },
  agentInspection: {
    sourceSha256,
    finalSha256,
    inspectedAt: { source, final, crops },
    methods: [
      "view_image:original-source",
      "view_image:original-final",
      "view_image:original-crops"
    ],
    decision: "accepted",
    checks: {
      textGlyphNumberSign: "none_observed",
      logoWatermarkBorder: "none_observed",
      unsafeImagery: "none_observed",
      codeNativeObjectLeak: "none_observed",
      answerOrChoiceCue: "none_observed",
      styleLighting: "matches_contract",
      backdropSemantics: "recognizable",
      crossBiomeDistinctness: "distinct",
      lowerMiddleLane: "clear",
      profileQuietZones: "retained"
    }
  },
  cropReview: {
    manifestSha256,
    profiles: [
      { id: "landscape", targetSize: [568, 320], focalPoint, quietZone, retainedRect, panelSha256, quietZoneRetained: true },
      { id: "tablet", targetSize: [1194, 834], focalPoint, quietZone, retainedRect, panelSha256, quietZoneRetained: true },
      { id: "portrait", targetSize: [320, 568], focalPoint, quietZone, retainedRect, panelSha256, quietZoneRetained: true }
    ]
  },
  humanReviews: { crop: null, semantic: null }
}
~~~

The built-in result's raw image data URL and raw output hint are never committed. The exact source identity comes **only** from that call's returned `result.image_url`: it must be one uniquely addressable `data:image/<png|jpeg|webp>;base64,...` string, and its decoded bytes must agree with both the declared MIME type and magic bytes. Decode those exact bytes directly into the ordinal's ignored source staging file; do not inspect `$CODEX_HOME/generated_images`, search any shared output directory, choose by modification time, scrape a preview, or accept a guessed/local/returned path. A missing, non-data, multiply represented, malformed, or mismatched result is that ordinal's terminal failure. The exact safe committed `resultMetadata` projection is `{ returnedModel, outputHintSha256 }`; `outputHintSha256` hashes the exact returned hint without retaining its contents or a machine path and is `null` only when no hint is returned. `resultMetadataSha256` is recomputed from the canonical two-key projection by every parser/checker run. `returnedModel` is `null` unless that exact field is actually returned.

The ignored terminal call ledger at `.artifacts/sound-seekers-v2/generation/calls.json` has exact shape `{schemaVersion:1,runId,task4Commit,task4BriefSetSha256,entries:[...]}` and exactly eight pre-created canonical call entries `{ordinal,chapterId,promptSha256,state,requestedAt,completedAt,resultMetadata,resultMetadataSha256,sourcePath,sourceSha256,errorCode}`. `state` is one of `planned`, `reserved`, `succeeded`, `failed`, or `unknown`; fields not applicable to the current state are exactly `null`. Its only permitted transitions are `planned -> reserved -> succeeded|failed` and startup recovery `reserved -> unknown`. Every write uses a same-directory `0600` temporary file, `fsync` on that file, atomic rename over `calls.json`, and `fsync` on the containing directory. Before each write, the validator canonicalizes every already-terminal entry and requires its bytes to equal the previous terminal receipt. Once an entry is `succeeded`, `failed`, or `unknown`, every field in that entry is immutable forever: later preparation, crop, inspection, review, finalization, rejection, or cleanup never adds to or alters it. Startup validates the complete ledger and atomically converts every surviving `reserved` entry to `unknown` before considering another ordinal. On success, the direct returned bytes are written to a same-directory temporary source file, fsynced, atomically renamed to `.artifacts/sound-seekers-v2/generation/source/<chapterId>.<verified-extension>`, re-read and hashed, and only then may that entry become `succeeded`. A crash between the tool call and that terminal write consumes the ordinal as `unknown` and never licenses a retry; an orphan source is cleanup-only. `errorCode` is a bounded non-sensitive enum, never raw tool output. `calls.json` contains call facts only and is retained after every success or failure cleanup; in particular, a `failed` or `unknown` tombstone is never deleted, compacted, rewritten, or replaced by a fresh ordinal.

All later mutable work is isolated in `.artifacts/sound-seekers-v2/generation/preparation.json`. It has exact shape `{schemaVersion:1,runId,task4Commit,task4BriefSetSha256,entries:[...]}` with the same eight canonical ordinals and each entry exactly `{ordinal,chapterId,terminalCallEntrySha256,stage,sourceCandidate,preparedCandidate,agentInspection,cropReview,humanReviews,cleanup}`. `terminalCallEntrySha256` is `null` until that call is terminal and thereafter is the canonical SHA-256 of the immutable call entry. `stage` is one of `awaiting_call`, `source_ready`, `source_accepted`, `prepared`, `final_accepted`, `crop_accepted`, `rejected`, or `cleaned`; no stage can make a failed/unknown call usable. `sourceCandidate` and `preparedCandidate` are either `null` or exact `{path,format,width,height,byteLength,sha256}` records. `agentInspection` is exactly `{source:null,final:null}` until a scope-specific record is written. A non-null scope record is exactly `{scope,candidateSha256,inspectedAt,method,decision,checks}`: `scope` is `source` or `final`; `candidateSha256` binds only the candidate that already exists at that stage; `method` is respectively `view_image:original-source` or `view_image:original-final`; `decision` is `accepted` or `rejected`; and `checks` has the nine exact SOURCE check keys other than `profileQuietZones`. It never requires or names the other scope's not-yet-existing hash. `cropReview` is `null` or exact `{inspectedAt,method:"view_image:original-crops",decision,manifestSha256,profiles}` bound to all 24 panels, where accepted profiles establish `profileQuietZones:"retained"`. `humanReviews` is always exactly `{crop:null,semantic:null}` in Task 5. `cleanup` is exactly `{completedAt:null,removedCandidatePaths:[]}` until cleanup, then records only the exact removed candidate/temp paths and timestamp. Every mutation uses the same `0600` temporary-file/fsync/atomic-rename/directory-fsync protocol as `calls.json`, validates `runId`, Task 4 hashes, terminal receipt hashes, and the legal stage transition, and never mutates the call ledger. At finalization—and never earlier—the tool combines the accepted source record, accepted final record, and accepted crop review into the one committed SOURCE `agentInspection`: source/final hashes come from their bound candidates; `inspectedAt` is exactly `{source:source.inspectedAt,final:final.inspectedAt,crops:cropReview.inspectedAt}`; methods take the fixed three-value order; the nine shared checks must be accepted in both source/final records; and `profileQuietZones` comes only from the crop review. This second ledger is the only ignored authority for preparation, crop, inspection, human-review status, rejection, and candidate cleanup.

`humanReviews.crop` and `humanReviews.semantic` are independent and remain `null` throughout Task 5. A later explicit direct-person review may replace one `null` with `{ finalSha256, reviewedAt, reviewerRole, environment, decision, evidenceRefs, cropProfiles }` for crop or `{ finalSha256, reviewedAt, reviewerRole, environment, decision, evidenceRefs, backdropReviewSemanticIds }` for semantics. `reviewedAt` is a valid RFC 3339 UTC instant; `reviewerRole` and `environment` are non-empty; `decision` is exactly `approved` or `rejected`; and `evidenceRefs` is a non-empty unique array. A valid crop approval names exactly `landscape`, `tablet`, and `portrait`; a valid semantic approval names exactly that kit's `backdropReviewSemanticIds` and no `codeNativeSemanticIds`. Stored booleans, named-person requirements, agent/automation approvals, stale hashes, shared combined review records, and blanket generated approvals are invalid. Task 5 never runs `record:app-visual-review`; the existing direct app-visual-review gate may truthfully remain open.

- [ ] **Step 1: Write failing pure prompt, parser, manifest, transform, raster, root, and review tests**

```js
const EXPECTED_COMPLETE_PROHIBITIONS = Object.freeze([
  "characters", "residents", "route", "landmark", "state", "reward", "meaning",
  "option", "choice", "interactable", "interactive objects", "collectible",
  "grapheme plate", "focus", "feedback", "interface", "interface object",
  "foreground action", "isolated or highlighted choice",
  "correctness cue", "answer cue", "text", "letters", "words", "glyphs", "numerals",
  "signs", "labels", "alphabet-like marks", "runes", "logos", "watermarks", "borders",
  "third-party characters", "unsafe imagery", "high-contrast clutter in the play lane"
]);

const EXPECTED_SHARED_PROMPT_LINES = Object.freeze({
  beforeScene: Object.freeze([
    "Use case: stylized-concept",
    "Asset type: decorative early-literacy 2D game background",
    "Primary request: Create one answer-neutral Sound Seekers biome backdrop from the immutable scene description and required backdrop elements only."
  ]),
  afterScene: Object.freeze([
    "Style/medium: Shape-led hand-painted storybook environment; restrained paper and gouache texture; rounded readable environmental silhouettes; no extra objects.",
    "Composition/framing: Wide landscape source with one full-bleed 16:9 crop of at least 1536x864 usable pixels; clear lower-middle play lane; quiet depth; subdued play-space contrast.",
    "Lighting/mood: Consistent upper-left lighting; welcoming, calm, adventurous.",
    "Constraints: Decorative backdrop only; include exactly the required backdrop elements; preserve a clear lower-middle lane; no characters, residents, route, landmark, state, reward, meaning, option, choice, interactable, interactive objects, collectible, grapheme plate, focus, feedback, interface, interface object, foreground action, isolated or highlighted choice, correctness cue, answer cue, text, letters, words, glyphs, numerals, signs, labels, alphabet-like marks, runes, logos, watermarks, borders, third-party characters, unsafe imagery, or high-contrast clutter in the play lane.",
    "Avoid: Do not add, translate, embellish, label, or restate any biome-specific object beyond the exact scene description and ordered required backdrop elements."
  ])
});

const EXPECTED_BACKGROUND_PROMPT_SNAPSHOTS = Object.freeze([
  Object.freeze({
    chapterId: "seedwake-meadow",
    sceneLine: "Scene/backdrop: Dawn pasture, living hedges, warm wood, distant seed-lantern glow, pale gold and fresh green; quiet lower-middle lane. Required backdrop elements, in this exact order: dawn pasture; living hedges; distant windmill lantern silhouette.",
    sha256: "566773a2c3683bad5f99af4f98b7838526737a4563dcacb1e6c5d0fd779a7cc7"
  }),
  Object.freeze({
    chapterId: "river-gardens",
    sceneLine: "Scene/backdrop: Terraced water channels, reeds, ceramic garden markers, turquoise and terracotta; quiet lower-middle lane. Required backdrop elements, in this exact order: terraced water channels; reed banks; distant ceramic terrace markers.",
    sha256: "c391e87edf00f683e5b8cecc5b2511b33821239503ebe933e102954c60a99c90"
  }),
  Object.freeze({
    chapterId: "fossil-canyon",
    sceneLine: "Scene/backdrop: Layered sandstone shelves, ancient tracks, bone arches and amber afternoon depth; quiet lower-middle lane. Required backdrop elements, in this exact order: layered sandstone shelves; ancient track bed; distant bone arch.",
    sha256: "abfb8de7cbb3c5331357cf5090243c004761942cfa188d67c462f8168d7f5298"
  }),
  Object.freeze({
    chapterId: "forge-settlement",
    sceneLine: "Scene/backdrop: Dark-stone workshops, distant furnace architecture, copper-and-iron depth and controlled ember light; quiet lower-middle lane. Required backdrop elements, in this exact order: distant furnace architecture; dark-stone workshops; copper rail depth.",
    sha256: "9c3f062a07998fc6dc458c32684fd763e11fbba8708aaccae2c5df4c03f3ad8d"
  }),
  Object.freeze({
    chapterId: "glass-marsh",
    sceneLine: "Scene/backdrop: Reflective jade pools, glass-reed depth, mist and refracted distant paths; quiet lower-middle lane. Required backdrop elements, in this exact order: reflective jade pools; distant glass reeds; mist path depth.",
    sha256: "7ef99218166110aa666a4c6ce53b4a161ae3498853a72fcf4b70801b285e57ab"
  }),
  Object.freeze({
    chapterId: "storm-coast",
    sceneLine: "Scene/backdrop: Sea cliffs, spray, distant timber shelters and a storm clearing toward warm light; quiet lower-middle lane. Required backdrop elements, in this exact order: sea cliffs; distant timber shelters; storm clearing toward warm light.",
    sha256: "5bea204b8f6933d2c293be6b5d26d910b885875c24078aa50d14b5ccf4688fb6"
  }),
  Object.freeze({
    chapterId: "lantern-forest",
    sceneLine: "Scene/backdrop: Deep layered woods, root-bridge depth, distant hanging lantern path, moss and muted gold; quiet lower-middle lane. Required backdrop elements, in this exact order: deep layered woods; distant root bridges; distant hanging lantern path.",
    sha256: "7055cee9cb3bc4bd0b978dad5d4170036b117944efa7efc5958ead23a021bedb"
  }),
  Object.freeze({
    chapterId: "star-reach",
    sceneLine: "Scene/backdrop: High observatory terraces, distant comet stairs, night sky, indigo and warm starlight; quiet lower-middle lane. Required backdrop elements, in this exact order: high observatory terraces; distant comet stairs; night sky.",
    sha256: "bb66a888724708abff0be3c38a16ff89b30a8eb117acef437de882a3d746e85a"
  })
]);

test("[preflight] prompts equal eight independent literal snapshots", () => {
  assert.deepEqual(SOUND_SEEKERS_V2_BACKGROUND_ORDER, [
    "seedwake-meadow", "river-gardens", "fossil-canyon", "forge-settlement",
    "glass-marsh", "storm-coast", "lantern-forest", "star-reach"
  ]);
  assert.deepEqual(
    SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY.prohibitions,
    EXPECTED_COMPLETE_PROHIBITIONS
  );
  assert.deepEqual(
    EXPECTED_BACKGROUND_PROMPT_SNAPSHOTS.map(item => item.chapterId),
    SOUND_SEEKERS_V2_BACKGROUND_ORDER
  );
  for (const [index, kit] of SOUND_SEEKERS_BIOME_KITS.entries()) {
    const snapshot = EXPECTED_BACKGROUND_PROMPT_SNAPSHOTS[index];
    const expectedPrompt = [
      ...EXPECTED_SHARED_PROMPT_LINES.beforeScene,
      snapshot.sceneLine,
      ...EXPECTED_SHARED_PROMPT_LINES.afterScene
    ].join("\n");
    const prompt = buildSoundSeekersV2BackgroundPrompt(kit);
    assert.equal(prompt, expectedPrompt);
    assert.equal(sha256Text(expectedPrompt), snapshot.sha256);
    assert.equal(sha256Text(prompt), snapshot.sha256);
    for (const semanticId of kit.codeNativeSemanticIds) {
      assert.equal(prompt.includes(semanticId), false);
    }
    for (const prohibition of EXPECTED_COMPLETE_PROHIBITIONS) {
      assert.ok(prompt.includes(prohibition));
    }
  }
});

test("[real-root] every v2 background is exact, deterministic, bounded, and provenance locked", async () => {
  const manifest = readSoundSeekersV2AssetManifest();
  assert.equal(manifest.schemaVersion, 2);
  assert.deepEqual(manifest.assets.map(item => item.chapterId), SOUND_SEEKERS_V2_BACKGROUND_ORDER);
  assert.deepEqual(manifest.assets.map(item => item.generation.callOrdinal), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(new Set(manifest.assets.map(item => item.final.sha256)).size, 8);
  assertSoundSeekersV2AssetManifest(manifest, SOUND_SEEKERS_BIOME_KITS);

  for (const [index, kit] of SOUND_SEEKERS_BIOME_KITS.entries()) {
    const asset = manifest.assets[index];
    assert.equal(asset.id, kit.background.provenanceId);
    assert.equal(asset.path, kit.background.src);
    assert.equal(asset.generation.prompt, buildSoundSeekersV2BackgroundPrompt(kit));
    assert.equal(
      asset.generation.resultMetadata.returnedModel === null
        || typeof asset.generation.resultMetadata.returnedModel === "string",
      true
    );
    assert.match(asset.generation.resultMetadata.outputHintSha256 ?? "", /^(?:|[a-f0-9]{64})$/u);
    assert.equal(
      asset.generation.resultMetadataSha256,
      sha256Canonical(asset.generation.resultMetadata)
    );
    assert.equal(asset.transform.encode.quality, 82);
    assert.ok([82, 80, 78].includes(asset.transform.encode.quality));
    assert.equal(asset.transform.encode.doubleEncodeSha256, asset.final.sha256);
    assert.equal(Number.isSafeInteger(asset.final.byteLength), true);
    assert.ok(asset.final.byteLength > 0);
    assert.deepEqual(asset.final, {
      format: "webp", width: 1536, height: 864,
      byteLength: asset.final.byteLength, sha256: asset.final.sha256,
      opaque: true, pages: 1
    });
    assert.deepEqual(asset.cropReview.profiles.map(item => [item.id, item.targetSize]), [
      ["landscape", [568, 320]], ["tablet", [1194, 834]], ["portrait", [320, 568]]
    ]);
    for (const profile of asset.cropReview.profiles) {
      const task4Profile = kit.background.cropProfiles[profile.id];
      assert.deepEqual(profile.targetSize, task4Profile.targetSize);
      assert.deepEqual(profile.retainedRect, computeBackgroundCrop({
        sourceSize: [1536, 864],
        targetSize: task4Profile.targetSize,
        focalPoint: task4Profile.focalPoint
      }));
    }
    assert.deepEqual(asset.humanReviews, { crop: null, semantic: null });
  }
  await assertSoundSeekersV2Assets({ root: process.cwd(), kits: SOUND_SEEKERS_BIOME_KITS });
});
```

Every pure/synthetic test name begins `[preflight]`; the one committed-tree fixture begins `[real-root]`. The same test file must use isolated temporary roots to reject, one mutation at a time: zero/seven/nine assets; wrong order or call ordinal; duplicate ID/path/source/final hash; missing/extra schema keys; a second JSON fence; malformed/non-UTC dates or hashes; guessed non-returned model data; missing/extra safe result-metadata keys, a malformed output-hint hash, a mismatched recomputed metadata hash, or a raw hint/path; prompt, literal snapshot, prompt hash, complete prohibition list, or Task 4 brief drift; a prompt containing any code-native/forbidden ID; a source crop outside oriented bounds; a crop smaller than 1536×864; upscale/stretch; a quality other than exact 82 or a wrong kernel/Sharp/libvips record; non-WebP, wrong magic bytes, wrong dimensions, zero bytes, alpha, animation, metadata, or non-sRGB output; mismatched double-encode/final/current-file hashes or a recorded `byteLength` unequal to the measured final bytes; absent/duplicate crop profiles, a changed target size, a retained rectangle unequal to `computeBackgroundCrop()`, a canonical `{x,y,width,height}` quiet zone changed to an edge tuple, any quiet zone or fixed action lane not retained, a noncanonical panel name, overlay coordinate, renderer setting, panel byte/hash, or review-manifest hash; stale/malformed agent inspection; stored human booleans or malformed/stale/cross-category human reviews; absolute/data-URL/source/output-hint leakage; traversal, symlink, FIFO, undeclared/orphan/temporary/source/rejected files; and any public-root file other than the exact eight WebPs plus `SOURCE.md`.

Synthetic call-ledger tests create all eight `planned` entries, prove the exact atomic `planned -> reserved -> succeeded|failed` transitions, simulate process interruption after reservation and after direct-source rename, reopen to `unknown`, and prove that terminal/unknown ordinals can never invoke the injected tool again. They reject a missing/extra/reordered entry, duplicate ordinal/chapter, Task 4 hash drift, a state/field mismatch, any byte change to a terminal receipt, a preparation/review/cleanup field in `calls.json`, non-atomic writer injection, raw error/tool data, and finalization with any state other than eight `succeeded`. Separate preparation-ledger tests exercise every legal stage and reject a call-state field in `preparation.json`, terminal receipt-hash mismatch, illegal stage skip, inspection before the hash-bound candidate exists, crop acceptance before both inspections, a non-null Task 5 human review, or cleanup that rewrites or deletes either ledger. Injected result fixtures prove the decoder accepts only the exact returned data URL bytes and rejects a missing URL, HTTP URL, local path, multiple candidate URLs, malformed base64, MIME/magic disagreement, directory scan, modification-time selection, and a source hash not re-read after atomic rename. Failure-cleanup fixtures remove only exact hash-bound source/prepared/crop/staging candidates while preserving `calls.json`, `preparation.json`, every terminal `failed`/`unknown` tombstone, and adjacent sentinels. Use copied arrays or `toSorted()`; tests must not mutate frozen Task 4 or parsed manifest data. Mechanical checks validate structure, bytes, and hash binding; they cannot substitute for the recorded direct visual inspection.

- [ ] **Step 2: Run the asset test and confirm the red state**

Run:

```bash
node --test tests/unit/soundSeekersAssetManifest.test.js
```

Expected: FAIL because the v2 asset root, parser, manifest, and raster files do not exist.

- [ ] **Step 3: Implement the pure prompt/manifest authority and fail-closed asset tools**

Implement the exact exports and schema above. `soundSeekersV2AssetManifest.mjs` imports only the pure Task 4 biome catalog (including its re-exported `computeBackgroundCrop()`) and Node standard-library modules; it must not import React, a renderer, Task 6, a generated raster, or a legacy asset authority. Canonical JSON hashing sorts object keys while preserving array order. Parsing uses the one fenced JSON object only and never derives a missing value from surrounding prose.

`prepareSoundSeekersV2Background.mjs` has these exact call-ledger and preparation-ledger modes; aliases and mixed modes are invalid:

```bash
node tools/prepareSoundSeekersV2Background.mjs --init-calls-ledger --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json
node tools/prepareSoundSeekersV2Background.mjs --resume-calls-ledger --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json
node tools/prepareSoundSeekersV2Background.mjs --reserve-call --ordinal 1 --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json
node tools/prepareSoundSeekersV2Background.mjs --capture-call-result --ordinal 1 --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json
node tools/prepareSoundSeekersV2Background.mjs --record-call-failure --ordinal 1 --code TOOL_CALL_FAILED --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json
node tools/prepareSoundSeekersV2Background.mjs --init-preparation-ledger --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json
node tools/prepareSoundSeekersV2Background.mjs --record-agent-inspection --chapter seedwake-meadow --scope source --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json
node tools/prepareSoundSeekersV2Background.mjs --prepare --chapter seedwake-meadow --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json
node tools/prepareSoundSeekersV2Background.mjs --record-agent-inspection --chapter seedwake-meadow --scope final --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json
node tools/prepareSoundSeekersV2Background.mjs --record-crop-review --manifest .artifacts/sound-seekers-v2/crop-review/manifest.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json
node tools/prepareSoundSeekersV2Background.mjs --finalize --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json
node tools/prepareSoundSeekersV2Background.mjs --cleanup-candidates --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json --expect-public absent
```

`--init-calls-ledger` derives the current Task 4 commit and canonical brief-set hash itself and refuses an existing call ledger. `--resume-calls-ledger` performs only the atomic `reserved -> unknown` recovery and prints the remaining planned ordinals. `--reserve-call` validates that exactly the named next canonical entry is `planned` and performs the durable reservation before returning. `--capture-call-result` reads one strict JSON object `{image_url,output_hint,returnedModel}` from stdin, requires `image_url` and allows the latter two as exact returned value or `null`, decodes/writes/verifies the direct result, then durably marks that reserved ordinal succeeded; it never accepts a path or a second image field. `--record-call-failure` accepts only the fixed non-sensitive error-code enum and durably terminates a reserved ordinal. None of those five modes opens or writes `preparation.json`.

`--init-preparation-ledger` refuses an existing preparation ledger and writes the exact eight-entry mutable schema bound to the current call-ledger run and Task 4 hashes. It may run before calls finish; each terminal receipt hash is filled from `calls.json` only when first needed and can never change thereafter. `--record-agent-inspection` reads one strict inspection object from stdin, requires the exact current source/final candidate hash for the named scope, and performs the single legal inspection transition; it cannot edit call metadata or set human review. `--prepare` derives the source path/hash solely from that chapter's immutable succeeded call receipt and requires an accepted source inspection. `--record-crop-review` reads and revalidates the one complete 24-panel manifest, then atomically writes all eight exact crop projections only after every final inspection is accepted. `--finalize` is read-only with respect to `calls.json`; it requires eight immutable succeeded receipts plus eight `crop_accepted` preparation entries and copies only validated facts into the staged SOURCE manifest. `--cleanup-candidates` validates both ledgers, removes only exact hash-bound candidate/temp paths, and atomically records those removals in `preparation.json`. All modes reject unknown arguments, out-of-order/state-invalid transitions, cross-ledger run/hash mismatch, or Task 4 drift.

`--prepare` rejects a non-file, symlink, traversal, wrong chapter/order, missing prompt/source hash, alpha/animated source, or oriented source too small to supply a 1536×864 crop. After EXIF auto-orientation, choose the largest integer 16:9 rectangle using `scale = floor(min(sourceWidth / 16, sourceHeight / 9))`, `width = 16 * scale`, and `height = 9 * scale`. For Task 4 landscape focal point `[fx,fy]`, compute integer `left = clamp(round(fx * sourceWidth - width / 2),0,sourceWidth - width)` and `top = clamp(round(fy * sourceHeight - height / 2),0,sourceHeight - height)`. Downsample only, using Lanczos3, to exact 1536×864 sRGB. Encode once with exact WebP quality 82, effort 6, smart subsampling, and no metadata; encode the same input/settings a second time into a separate ignored file and require byte-identical SHA-256 before accepting the candidate and recording `doubleEncodeSha256`. Decode the selected bytes again and require WebP magic, exact 1536×864 dimensions, one opaque page, sRGB, and no metadata; record the actual measured positive `byteLength` without imposing an invented byte ceiling. Record the installed Sharp and libvips versions; do not change the existing Sharp dependency.

`--prepare` writes only under `.artifacts/sound-seekers-v2/generation/prepared/<chapterId>/`; it does not write `public/` or SOURCE. The largest-integer 16:9 source normalization above is independent of the three real-device crop profiles. `--finalize` requires eight successful ledger entries, exact prompt/brief/source/prepared/final hashes, all eight accepted agent inspections, all 24 crop records, and both human-review fields still `null`. It builds the complete `v2` tree in a sibling same-filesystem staging directory, reruns every assertion, refuses an existing destination or symlink, then renames the complete new root into place. Any error removes only the exact staging directory and leaves no partial public root. It never overwrites.

`--cleanup-candidates` is the one success/failure cleanup path. It accepts `--expect-public absent` for any blocked run or `--expect-public complete` after successful finalization. Before deleting, it validates both ledgers and requires every recorded direct-decoded source, prepared candidate, crop panel, and staging file to be a non-symlink regular file whose real path is a strict descendant of the exact ignored Task 5 candidate roots and whose SHA-256 still matches. It removes only those exact files and then only their now-empty candidate/temp directories; it never removes or rewrites `calls.json`, never removes a `failed`/`unknown` tombstone, never removes `preparation.json`, never scans or mutates `$CODEX_HOME/generated_images`, uses a glob, follows a symlink, removes a parent, or touches the public `v2` root. `absent` requires that public root not exist at all; `complete` first requires the checker to prove the exact final inventory. After deletion it atomically updates only `preparation.json.cleanup` with the exact removed paths; the terminal call receipt hashes must still validate even though a succeeded call's source candidate is now intentionally absent. An unknown path, symlink, hash mismatch, unexpected public root, or adjacent sentinel fails closed without deleting the uncertain target. Synthetic tests exercise partial ledgers at every ordinal/state, interruption after reservation/source write, tool failure, source rejection, final rejection, crop rejection, and finalization failure, and prove the call/preparation ledgers and unrelated neighboring files survive.

`buildSoundSeekersV2CropReview.mjs` accepts the ignored prepared-candidate root before finalization and imports Task 4's one `computeBackgroundCrop()`. Its renderer contract is exact and versioned: installed `sharp`/libvips versions recorded in the review manifest; PNG output with `{compressionLevel:9,adaptiveFiltering:false,palette:false}`; canonical chapter order; profile order `landscape`, `tablet`, `portrait`; and file name `<two-digit-callOrdinal>-<chapterId>--<profileId>--crop-review.png`. For each literal profile it calls the solver with `{sourceSize:[1536,864],targetSize:profile.targetSize,focalPoint:profile.focalPoint}` and records the exact returned `{x,y,width,height,objectPosition}` as `retainedRect`; it contains no cover/aspect/object-position formula of its own. It renders that returned rectangle into the exact 24 panels at 568×320, 1194×834, and 320×568.

Overlay geometry is reproducible data, not an eyeballed annotation. Every Task 4 source-space quiet zone remains verbatim in its canonical normalized `{x,y,width,height}` shape in memory, the preparation ledger, crop-review manifest, and SOURCE; no layer stores or hashes a `[left,top,right,bottom]` replacement. Only the renderer's local containment/pixel computation may derive `left=x`, `top=y`, `right=x+width`, and `bottom=y+height`, and those derived edges are discarded after drawing. The fixed lower-middle action-lane review frame is panel-normalized exactly `{x:0.20,y:0.58,width:0.60,height:0.30}`, so it means the same usable on-screen region in landscape, tablet, and portrait. A source point maps to panel pixels as `(source - retainedRect.origin) * targetSize / retainedRect.size`; panel-normalized action-lane coordinates multiply directly by target size. Positive pixel coordinates round with `floor(value + 0.5)`, rectangle left/top use `floor`, and right/bottom use `ceil`. The panel has a 3px inset retained-edge border `rgba(0,229,255,255)`, a 3px quiet-zone rectangle `rgba(255,214,10,255)`, a 3px action-lane rectangle `rgba(255,79,216,255)`, and a focal marker made from two 9px axis lines centered on the mapped point in `rgba(255,255,255,255)`; there is no font, label, shadow, blending ambiguity, scaling after overlay, or metadata. The tool fails unless the complete quiet zone lies inside the solver rectangle and the fixed action-lane frame lies inside the panel before drawing. The exact manifest is `{schemaVersion:1,renderer:{sharpVersion,libvipsVersion,panelFormat:"png",pngOptions,rounding,overlayContract},panels:[...]}`; every panel record contains exactly `{callOrdinal,chapterId,profileId,file,targetSize,sourceSha256,finalSha256,retainedRect,focalPoint,quietZone,actionLane,overlayPixels,panelSha256}`. Its canonical SHA-256 is computed over that entire object and stored in every SOURCE asset's `cropReview.manifestSha256` alongside that asset's three panel hashes.

`checkSoundSeekersV2Assets.mjs` exports the async assertion, keeps CLI exit handling behind a guarded main, walks without following symlinks, validates exact root inventory and real file type/magic/decode/schema/hash/size/crop/review joins, and recomputes every retained rectangle through Task 4. On every check—even after the transient panels have been deleted—it regenerates all 24 panels and the full review manifest into one fresh ignored temporary directory using the same exported renderer, compares every regenerated panel SHA-256 and canonical manifest SHA-256 to SOURCE, and removes that temporary directory in `finally`. A stale stored hash or changed Sharp/libvips/rounding/overlay contract fails rather than silently blessing new evidence. It fails on every forbidden case listed in Step 1. `check:public-media-policy` remains supplemental; it is not this root's authority.

- [ ] **Step 4: Run pure and synthetic tests before spending the eight-call budget**

Run:

```bash
node --test --test-name-pattern='^\[preflight\]' tests/unit/soundSeekersAssetManifest.test.js
npm run check:public-media-policy
git check-ignore -q .artifacts/sound-seekers-v2/generation/calls.json
git check-ignore -q .artifacts/sound-seekers-v2/generation/preparation.json
```

Expected: every `[preflight]` prompt/schema and synthetic transform/root/review/cleanup test PASS; the name filter deliberately excludes the single `[real-root]` fixture already proved red in Step 2 because no image call or public v2 root exists. The command must report the real-root test as skipped by pattern, not silently rename or delete it. `.artifacts/` is confirmed ignored. Do not generate while any pure/synthetic test fails.

- [ ] **Step 5: Make the exact ordered eight-call built-in generation run**

Read `/Users/benjaminbowler/.codex/skills/.system/imagegen/SKILL.md` completely before generation. Make eight separate built-in image-generation calls, one per biome. Never batch several distinct backgrounds into one call.

Before the first call, run the exact `--init-calls-ledger` and `--init-preparation-ledger` modes from Step 3, fsync both exact eight-entry ledgers, and reopen both through their production validators. The call ledger starts with all states `planned`; the preparation ledger starts with all stages `awaiting_call` and both human-review fields null. On resume, run `--resume-calls-ledger`, convert any surviving `reserved` call to terminal `unknown`, revalidate the unchanged preparation ledger, and never call that ordinal. For each still-planned canonical kit, compute and freeze `expectedPrompt = buildSoundSeekersV2BackgroundPrompt(kit)`, atomically persist only that call entry as `reserved`, then call the tool. In code mode use the 120-second execution pragma and the same 120-second wait for a yielded tool cell. The built-in call itself is exactly:

```js
// @exec: {"yield_time_ms": 120000}
const result = await tools.image_gen__imagegen({ prompt: expectedPrompt });
```

Do not pass any other argument. On a thrown result, atomically record only the bounded `failed` code. On success, require that exact result's single `image_url` data URL, decode and magic-check its bytes, atomically write/re-read/hash the canonical ignored source, hash the allowlisted non-binary metadata, and only then transition the entry to `succeeded`; call `generatedImage(result)` to expose that same returned image for review after the durable success write. Never inspect a shared generated-images directory, accept a path, or search by time/name. Do not use a prior conversation image, generated output, rejected image, legacy asset, or another biome as a reference.

After all eight ordinals are terminal, assert the call-ledger ordinals/chapters are exactly 1–8 in canonical order and there is no ninth entry or second call for any ordinal. If any entry is `failed`/`unknown`, any source is missing, or fewer than eight entries are `succeeded`, do not revise/retry/edit/fallback and do not prepare/promote assets. Capture the exact non-sensitive blocker summary, run `--cleanup-candidates --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json --expect-public absent`, confirm the public root is absent, and confirm `calls.json` still contains all eight immutable terminal receipts including every failure/unknown tombstone before reporting the blocker.

- [ ] **Step 6: Inspect all untouched sources, prepare deterministic finals, and inspect full-resolution finals**

Open every copied untouched source with `view_image(detail: "original")`. Check the exact `agentInspection.checks` fields and compare all eight together for one coherent style and eight distinct place identities. For each accepted source, send its strict hash-bound inspection object to the exact `--record-agent-inspection --scope source` mode; scripts never infer acceptance. A source with any text-like mark, code-native/interactable/choice object, answer cue, unsafe imagery, watermark/logo/border, blocked lane, semantic mismatch, duplicate-looking biome, or inconsistent style/lighting is rejected and blocks Task 5; the agent does not repair or replace it. Record the exact rejection and stage only in `preparation.json`, then run `node tools/prepareSoundSeekersV2Background.mjs --cleanup-candidates --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json --expect-public absent`; confirm the public root is absent and the immutable call ledger survives, then report the blocker.

Run `--prepare` once per accepted source in canonical order. Open each prepared 1536×864 WebP with `view_image(detail: "original")` and repeat the checks against the actual final bytes. Only after viewing both hash-bound files may the agent send the final inspection object to `--record-agent-inspection --scope final`; that command writes only `preparation.json`, and no script infers or self-sets inspection. `containsText: false` or another unobserved boolean is not a substitute for this evidence. A rejected prepared final records only the exact preparation-ledger rejection, then runs `node tools/prepareSoundSeekersV2Background.mjs --cleanup-candidates --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json --expect-public absent`; prove public-root absence and immutable-call-ledger preservation before reporting the blocker.

- [ ] **Step 7: Render and inspect the exact 24 child-profile crops, then promote transactionally**

Run:

```bash
node tools/buildSoundSeekersV2CropReview.mjs --candidate-root .artifacts/sound-seekers-v2/generation/prepared
```

Expected: exactly 24 panel files plus one review manifest under `.artifacts/sound-seekers-v2/crop-review/`; no public file changes. Open every panel at original detail. Confirm the exact Task 4 focal point, verbatim `{x,y,width,height}` quiet zone, solver-returned retained rectangle, and lower-middle lane are retained without cropped identity cues or code-native leakage. Then run the exact `--record-crop-review` mode once so only `preparation.json` receives the validated panel/manifest hashes and `profileQuietZones: "retained"`; `calls.json` remains byte-identical. A failed final or crop blocks with no new generation call: capture the exact reason, run `node tools/prepareSoundSeekersV2Background.mjs --cleanup-candidates --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json --expect-public absent`, confirm the public root is absent and the call/preparation ledgers survive, then report.

Run finalization only after all eight source/final records and 24 crop records are accepted:

```bash
node tools/prepareSoundSeekersV2Background.mjs --finalize --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json
node tools/checkSoundSeekersV2Assets.mjs
```

Expected: the complete exact public tree appears atomically and the checker passes. `SOURCE.md` keeps `humanReviews.crop` and `humanReviews.semantic` null for all eight. This is agent/mechanical candidate evidence only. Do not run or update the blanket app-visual-review recorder; a current app-visual-review gate that detects these new hashes remains a truthful direct-review gate, not a reason to fabricate approval.

- [ ] **Step 8: Add the package script and run the complete Task 5 green gate**

Add:

```json
"check:sound-seekers-assets": "node tools/checkSoundSeekersV2Assets.mjs"
```

Run:

```bash
npm run check:sound-seekers-assets
node --test tests/unit/soundSeekersAssetManifest.test.js tests/unit/soundSeekersBiomeKits.test.js
npm run check:public-media-policy
git diff --check
```

Expected: PASS with exact ordered eight/24 cardinalities; prompts re-derived from current immutable Task 4 briefs; exact source/final/crop/hash joins; exact 1536×864 opaque single-frame sRGB WebPs; no stretch/upscale; exact quality 82; deterministic double encodes; each asset's measured positive byte length matching SOURCE and its current bytes with no invented size ceiling; exact root inventory; no traversal/symlink/orphan/source/temp/rejected file; hash-bound truthful agent inspections; both human reviews null; and no claim of browser, offline, fallback, human, physical-device, or observed-child readiness.

**Locked Task 6 handoff:** Task 6 must import this parser and consume exactly the eight accepted manifest records, not scan the directory or invent a second asset list. It must render raster review coverage for all eight kits and all 24 exact crop profiles; judge `backdropReviewSemanticIds` from the raster/screenshots only, never require them as code-native DOM objects; test Task 4 `codeNativeSemanticIds` separately; warm/fetch every one of the eight exact URLs and verify complete offline bytes against manifest SHA-256; and force each of the eight background requests to fail once while confirming the complete code-native scene remains playable and accessible. Task 6 may not mutate Task 5 prompts, bytes, provenance, agent inspections, or human-review fields, and it may not convert null human reviews into approval. The Task 6 section remains responsible for browser/offline/fallback evidence and later direct-review reporting.

- [ ] **Step 9: Clean exact temporary outputs, stage exactly 15 paths, inspect, and commit**

After final/public verification, run `node tools/prepareSoundSeekersV2Background.mjs --cleanup-candidates --calls-ledger .artifacts/sound-seekers-v2/generation/calls.json --preparation-ledger .artifacts/sound-seekers-v2/generation/preparation.json --expect-public complete`. This removes only the eight exact hash-matched built-in source candidates plus exact prepared/crop/staging candidates under the fail-closed rules above, retains both ledger files, and records cleanup only in `preparation.json`. Reopen both validators and prove all eight immutable terminal call receipts are byte-identical, including any tombstone if the path is exercised synthetically. Confirm the complete public root still passes, and no rejected/source/temp file remains under `public/` or in the staged diff.

```bash
git add -A -- public/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp public/game-assets/sound-seekers/v2/biomes/river-gardens/background.webp public/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp public/game-assets/sound-seekers/v2/biomes/forge-settlement/background.webp public/game-assets/sound-seekers/v2/biomes/glass-marsh/background.webp public/game-assets/sound-seekers/v2/biomes/storm-coast/background.webp public/game-assets/sound-seekers/v2/biomes/lantern-forest/background.webp public/game-assets/sound-seekers/v2/biomes/star-reach/background.webp public/game-assets/sound-seekers/v2/SOURCE.md tools/lib/soundSeekersV2AssetManifest.mjs tools/prepareSoundSeekersV2Background.mjs tools/buildSoundSeekersV2CropReview.mjs tools/checkSoundSeekersV2Assets.mjs tests/unit/soundSeekersAssetManifest.test.js package.json
git diff --cached --name-status
git diff --cached --check
git diff --cached -- package.json
git commit -m "feat: add eight Sound Seekers candidate biome backgrounds"
```

The cached list must contain exactly the 15 owned paths above and nothing else. The `package.json` diff contains only `check:sound-seekers-assets`. The cache must not contain this plan, Task 1–4/6 code, `biomeKits.js`, global visual-review records/tools, `.artifacts`, a generated source, a rejected candidate, a public temp file, or a legacy asset. Commit wording says candidate backgrounds; it does not claim human approval or release readiness.

### Task 6: Integrate static truth gates, offline media, and a content/art review gallery

**Dependency and collision stop:** Do not begin Task 6 until the reviewed Task 1–5 commits exist, every focused Task 1–5 gate passes at those commits, and their scoped paths are clean. In particular, import the actual committed Task 2 `coverageStatus(state)`, `validContentDeckUses(state,category)`, `validAttemptReceipts(state)`, and sole all-40 `materializeStoryTransferChallenge()` producer; Task 3 presentation/branch APIs; Task 4 `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS`/component/capability APIs; and Task 5 `readSoundSeekersV2AssetManifest()`. Do not restate a planned shape, pass a deck-only fragment, scrape a directory, copy an allowlist, or create a second catalog. If any dependency is absent, dirty, or still under review, stop. Task 6 may edit only the exact 22 paths below.

**Files:**
- Create: `tools/checkSoundSeekersV2Content.mjs`
- Create: `tools/checkSoundSeekersVisualSemantic.mjs`
- Create: `tools/lib/soundSeekersV2GalleryManifest.mjs`
- Extend: `tools/checkQuestIntegrity.js`
- Modify: `tools/viteQuestOfflinePlugin.mjs`
- Modify: `tools/checkQuestOffline.mjs`
- Create: `tools/serveQuestOfflineRangeTest.mjs`
- Create: `preview/sound-seekers-v2-content.html`
- Create: `preview/sound-seekers-v2-content.jsx`
- Create: `src/features/soundSeekers/preview/galleryReplayRecipes.js`
- Create: `src/features/soundSeekers/preview/ContentArtGallery.jsx`
- Create: `src/features/soundSeekers/preview/content-art-gallery.css`
- Create: `tools/shootSoundSeekersV2Content.mjs`
- Create: `tests/unit/soundSeekersV2ContentGate.test.js`
- Create: `tests/unit/soundSeekersVisualSemanticGate.test.js`
- Create: `tests/unit/soundSeekersGalleryReplay.test.js`
- Create: `tests/unit/soundSeekersV2GalleryManifest.test.js`
- Create: `tests/unit/soundSeekersV2GalleryIsolation.test.js`
- Create: `tests/browser/sound-seekers-visual-semantic.spec.js`
- Create: `tests/browser/sound-seekers-content-gallery.spec.js`
- Modify: `tests/quest-offline/quest-offline.spec.js`
- Modify: `package.json`

Do not use or create `/quest-preview.html`. Do not modify the production child route, Vite production inputs, or the quest release-preview inputs. This page is a deterministic dev-only gallery served only from its explicit `/preview/sound-seekers-v2-content.html` URL. Production source, the main bundle, the offline shell, and `/preview/quest.html` must not import, link, precache, or dynamically load it. Actual first-visit gameplay reachability belongs to the later runtime plan.

**Interfaces:**
- Consumes Task 1’s exact 40 expeditions, adaptive review authority, pronunciation invariant, and 80 heart-word owner opportunities plus the s6 shared action; Task 2’s five canonical catalogs, scheduler/transaction APIs, complete state/evidence/receipt authority, exact 80 heart visits/81 heart uses, `validAttemptReceipts(state)`, `validContentDeckUses(state,category)`, `coverageStatus(state)`, `materializeStoryTransferChallenge()` for all 40 stops, and the eight-boss object-identical `materializeBossTransferChallenge()` delegate; Task 3’s exact 40 child views, 112 option semantics, 48 post-decision semantics, 16 `SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES`, `SOUND_SEEKERS_MEANING_VISUAL_OWNERS`, direct meaning semantics, branded presentation reducer/checkpoint/rehydration/close API, and exact instruction/scene/prompt/meaning audio provenance; Task 4’s complete visual catalogs/components, branded-transition-only access API including persistent `storyOutcomeId`, crop solver, ten poses, and recursively frozen `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS`; and Task 5’s sole `readSoundSeekersV2AssetManifest()` parser plus its exact eight accepted records. No Task 6 module scans an asset directory, imports a private answer key, authors a presentation transition/evidence object, or duplicates an allowlist.
- Produces `assertSoundSeekersV2Content({productionBundlePath=null}={})`, `buildSoundSeekersV2AuthoritySnapshot()`, `validateSoundSeekersV2ContentAuthorities(authorities)`, `assertSoundSeekersVisualSemantics()`, `validateSoundSeekersVisualAuthorities(authorities)`, `buildSoundSeekersV2CanonicalCoverageFixture()`, `summarizeSoundSeekersV2Coverage()`, `scanSoundSeekersV2SourcePolicy()`, `SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS`, `parseSoundSeekersGalleryQuery(search)`, `replaySoundSeekersGalleryFixture({recipeId,sceneId,seed,optionId=null})`, `SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX`, `buildSoundSeekersV2GalleryManifest(run)`, `assertSoundSeekersV2GalleryManifest(manifest)`, and `soundSeekersV2GalleryRunId(inputs)`.
- Produces `check:sound-seekers-content`, aggregate `check:sound-seekers-art`, exact v2 media warming/range evidence, and an exhaustive dev-gallery matrix for eight kits, 24 real-device raster crops, 40 scenes containing all 112 options, 40 routes/landmarks, eight Wonders, both persistent narrative branches for each of eight bosses, 32 cast characters plus player in all ten poses, every direct meaning through its canonical owner/current capability, every Task 4 creator option, every background failure, both density axes, both motion axes, 320 CSS px, genuine 200% browser zoom, pointer/touch/Enter/Space/focus, and no-answer-leak fixtures.
- `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS` is the only creator enumeration authority. Creator preview and in-world rendering receive the same `createCharacterAppearance()` result and must have byte-identical `serializeCharacterAppearance()` output as well as the same `appearanceSignature()`; a matching signature alone is insufficient.
- Gallery URL:

```text
/preview/sound-seekers-v2-content.html?stop=s20&fixture=assessed-correct-resolved&density=full&motion=full&labels=hidden&seed=11
```

Creator URLs are generated only by URL-encoding real IDs read from `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS`; the plan deliberately contains no fallback creator ID. Query keys `state`, `phase`, `worldState`, `sceneAccess`, `evidence`, `answer`, and `correct` are rejected. `fixture` accepts only a member of `SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS`; it never directly names a render phase.

- [ ] **Step 1: Write failing pure aggregate, visual-boundary, replay, manifest, isolation, and browser tests**

`soundSeekersV2ContentGate.test.js` drives a deterministic aggregate fixture through the actual Task 2 scheduler/transaction APIs, passes the complete normalized state including all five deck categories, evidence, receipts, and checkpoint fields to the actual `coverageStatus(state)`, and then asserts this exact Task 6 projection:

```js
assert.deepEqual(assertSoundSeekersV2Content().coverageSummary, {
  canonicalCoverage: {
    complete: true,
    categories: {
      heartWords: { coveredRecordCount: 60, totalRecordCount: 60 },
      stories: { coveredRecordCount: 40, totalRecordCount: 40 },
      alternatives: { coveredRecordCount: 4, totalRecordCount: 4 },
      morphology: { coveredRecordCount: 1, totalRecordCount: 1 },
      transfer: { coveredRecordCount: 40, totalRecordCount: 40 }
    }
  },
  validUseCounts: {
    heartWords: 81,
    stories: 40,
    alternatives: 4,
    morphology: 1,
    transfer: 40
  },
  assessedDecisionCounts: {
    connectedTextTransfer: 32,
    novelDecoding: 8
  }
});
```

`buildSoundSeekersV2CanonicalCoverageFixture()` is a test/gate fixture, not a production mission simulator. It serves and completes the canonical Task 1 slots through the real Task 2 reducers in one accumulating normalized state, retains all five categories plus the canonical evidence and attempt-receipt ledgers, records exactly 80 heart visits and 81 heart uses including the one s6 shared use, and returns exactly `{state,evidenceEvents,attemptReceipts}`. `evidenceEvents` and `attemptReceipts` are frozen ordered projections of the same canonical records inside `state`, not second authorities. `summarizeSoundSeekersV2Coverage()` calls `coverageStatus(state)` and deep-compares its real frozen return value to `canonicalCoverage` above; it separately calls `validAttemptReceipts(state)` and derives the exact 81/40/4/1/40 use counts through `validContentDeckUses(state,category)`. It never copies Task 2 eligibility, receipt validation, evidence linkage, or catalog-rehydration logic. This all-correct coverage fixture has exactly 32 connected-text and 8 boss final evidence events; retry/model receipt evidence is covered separately by the gallery-replay fixtures. Mutation tests add a structurally plausible unauthored record, orphan a reciprocal story/transfer use, corrupt one owner binding, conflict or omit a receipt/evidence dependency, drop each category in turn, change the 60/40/4/1/40 covered-record counts, change the 81/40/4/1/40 valid-use counts, or change the 32/8 all-correct final-event split; every mutation must fail.

The same tests clone each Task 1–5 catalog through `validateSoundSeekersV2ContentAuthorities(authorities)`/`validateSoundSeekersVisualAuthorities(authorities)` and independently reject every static failure listed in Step 3. `scanSoundSeekersV2SourcePolicy()` scans `.js`, `.jsx`, `.mjs`, and `.css`; a raw `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, or `0xRRGGBB` anywhere in the v2 tree except `src/features/soundSeekers/visual/visualTokens.js` fails, including a raw color placed in either CSS file.

`soundSeekersVisualSemanticGate.test.js` keeps raster and code-native truth separate:

```js
const manifest = readSoundSeekersV2AssetManifest();
assert.equal(manifest.assets.length, 8);
assert.equal(manifest.assets.flatMap(asset => asset.cropReview.profiles).length, 24);
assertSoundSeekersVisualSemantics();

for (const [kit, asset] of zip(SOUND_SEEKERS_BIOME_KITS, manifest.assets)) {
  assert.equal(asset.path, kit.background.src);
  assert.equal(asset.final.sha256, sha256File(publicFile(asset.path)));
  assert.deepEqual(asset.task4.backdropReviewSemanticIds, kit.backdropReviewSemanticIds);
  assert.deepEqual(asset.cropReview.profiles.map(profile => profile.targetSize), [
    [568, 320], [1194, 834], [320, 568]
  ]);
  assert.equal(intersection(kit.backdropReviewSemanticIds, kit.codeNativeSemanticIds).length, 0);
}
```

The snippet’s `zip`, `sha256File`, `publicFile`, and `intersection` are test-local helpers, not production interfaces. `backdropReviewSemanticIds` remain only raster/direct-review metadata in the Task 5 record and screenshot manifest. No test expects them as a code-native element, accessible name, or `data-code-native-semantic-id`. Conversely, the browser test renders all eight real kits and requires every exact Task 4 `codeNativeSemanticId` in the code-native scene subtree while proving none of that kit’s backdrop-review IDs appears there. Task 6 automation records which raster/crop a person must inspect; it never declares backdrop recognizability.

`soundSeekersGalleryReplay.test.js` proves the query and replay boundary:

```js
for (const recipeId of SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS) {
  const replay = replaySoundSeekersGalleryFixture({
    recipeId, sceneId: recipeScene(recipeId), seed: 11
  });
  assert.equal(replay.recipeId, recipeId);
  assert.equal(replay.transitionSource, "committed-reducer-replay");
  if (replay.sceneAccess) {
    assert.equal(validateSceneVisualAccess(replay.sceneAccess, replay.context), true);
  }
}

for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
  const optionIds = scene.choice.kind === "narrative_bridge"
    ? scene.choice.options.map(option => option.visualSemanticId)
    : [null];
  for (const optionId of optionIds) {
    const replay = replaySoundSeekersGalleryFixture({
      recipeId: scene.choice.kind === "narrative_bridge"
        ? "boss-resolved" : "assessed-resolved",
      sceneId: scene.id,
      seed: 11,
      optionId
    });
    assert.equal(replay.transitionSource, "committed-reducer-replay");
    assert.equal(isConnectedTextPresentationTransition(replay.presentationTransition), true);
    assert.equal(validateSceneVisualAccess(replay.sceneAccess, replay.context), true);
    if (scene.choice.kind === "narrative_bridge") {
      const expectedBranch = resolveNarrativeBranchOutcome(
        scene.id, replay.persistedNarrativeChoiceToken
      );
      assert.equal(replay.presentationTransition.storyOutcomeId,
        expectedBranch.storyOutcomeId);
      assert.equal(replay.presentationTransition.postDecisionSemanticId,
        expectedBranch.postDecisionSemanticId);
      assert.equal(replay.sceneAccess.storyOutcomeId, expectedBranch.storyOutcomeId);
      assert.equal(replay.canonicalEvidenceDomain, "novel_decoding");
    } else {
      assert.equal(replay.presentationTransition.storyOutcomeId, null);
      assert.equal(replay.canonicalEvidenceDomain, "connected_text_transfer");
    }
  }
}

for (const wrongCount of [1, 3]) {
  const audit = exerciseCanonicalWrongReloadCorrect({
    sceneId: wrongCount === 1 ? "scene-s1" : "scene-s5",
    wrongCount,
    seed: 11
  });
  assert.deepEqual(audit.phases, [
    ...Array(wrongCount).fill("correction"), "action", "resolved"
  ]);
  assert.equal(audit.serializedEnvelopeIncludedCompleteState, true);
  assert.equal(audit.oldCorrectionPresentationRejected, true);
  assert.equal(audit.oldCorrectionTransitionRejected, true);
  assert.equal(audit.correctionAccessRejected, true);
  assert.equal(audit.modelConsumed, wrongCount === 3);
  assert.equal(audit.freshChallengeAfterReload, true);
  assert.equal(audit.oldActionAccessRejectedAfterSecondReload, true);
  assert.equal(audit.freshActionAccessValid, true);
  assert.equal(audit.actionAccessRejectedAfterResolved, true);
  assert.equal(audit.freshResolvedAccessValid, true);
}

for (const unsafe of [
  "state=repair", "phase=resolved", "worldState=repair", "correct=true", "answer=x"
]) {
  assert.throws(() => parseSoundSeekersGalleryQuery(`?${unsafe}`));
}
```

`recipeScene()` and `exerciseCanonicalWrongReloadCorrect()` in the snippet are test-local helpers. The frozen production recipes cover pre-choice; one-miss correction/reload; three-miss model-required correction/reload; assessed action/resolved/direct-meaning; and both persistent boss branches at correction/action/resolved/direct-meaning. There is no consequence-free boss recipe.

`exerciseCanonicalWrongReloadCorrect()` implements this exact sequence with public Task 1–4 APIs. It begins and checkpoints the real Task 2 story-transfer transaction, then calls Task 2 `materializeStoryTransferChallenge(state,{transactionId})`; this is the sole challenge producer at every one of the 40 stops. For a non-boss it requires `createConnectedTextChallenge(state,{transactionId,routeSeed})` to return that same object identity, while a boss requires `materializeBossTransferChallenge(state,{transactionId})` to return that same object identity. Every wrong token is selected only from `challenge.optionTokens` by excluding that exact challenge's private `expectedToken`; the final response uses only that fresh challenge's `expectedToken`. The challenge remains in the test/replay closure, is never returned to JSX, and is projected with `toChildChallengeView()` before any child-facing use. A caller-authored option, key, expected word, or response is rejected.

For each requested wrong attempt, the helper calls `completeStoryTransferTransaction()`, then reduces the returned canonical `event.id` through exact `{type:"decision_committed",reducerRevision,evidenceEventId}`. It requires the exact-current Task 3 phase to be `correction`, its `correctionRecordId` to equal the Task 2 correction record, all payoff/meaning/story-outcome IDs to be null, and Task 4 issuance to reject that correction transition. After the final wrong it serializes exactly one JSON envelope `{schemaVersion:1,state:normalizeSoundSeekersState(task2State),presentation:checkpointConnectedTextPresentation(currentPresentation)}`. The serialized `state` must still contain all five deck categories, the complete canonical evidence ledger, every contiguous attempt receipt, and the live response/model checkpoint; no capability, transition, challenge, response, expected token, narrative branch record, derived support, or derived phase is serialized. It parses that JSON, normalizes the complete state, and calls `rehydrateConnectedTextPresentation(restoredState,restored.presentation)`. The pre-reload presentation and correction transition must now fail exact-current validation, and every pre-existing access from the presentation generation must fail; correction still cannot issue access.

When `wrongCount === 3`, the restored Task 2 checkpoint must be `model_pending`; the helper calls `completeStoryTransferCorrectionModel()` with only the canonical transaction identity. The Task 2 reducer itself rederives the current correction from valid receipt/evidence history and the fresh canonical challenge; no caller correction string or payload is accepted. That call emits no presentation event, receipt, evidence, or use, preserves the exact current correction transition, changes only Task 2 stage to `response_pending`, and is required before another response. For either wrong-count path, the helper then rematerializes a fresh challenge for the restored attempt, proves it is not a retained pre-reload object, commits the challenge-derived correct response, and reduces the exact final event to Task 3 `action`. It issues one current action access, serializes/rehydrates the complete Task 2 state plus action presentation checkpoint a second time, and proves the old action presentation, transition, and access are all invalid before issuing a fresh action access. Finally it reduces exact `{type:"action_completed",reducerRevision}`, proves the action access is stale, and issues a fresh `resolved` access. Tests require fail-closed behavior for a transition or capability literal, `Object.freeze()` lookalike, spread clone, `structuredClone`, JSON round trip, stale revision, cross-attempt access, cross-scene access, wrong event/transaction, and wrong-phase access.

For each boss, the gallery obtains the two choice records only from the Task 3 child scene. It passes the chosen token for the first and only time to `checkpointStoryTransferTransaction()` after the narrative choice; thereafter it drops the caller token and reads persistence only through normalized Task 2 checkpoint/final reciprocal uses. The token never enters the assessed boss challenge, response, evidence, or receipt. Both final uses must carry it byte-identically, and Task 3 must rederive the matching `SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES` record after both correction reload and completed reload. The two options for one boss must produce distinct stable `storyOutcomeId` and `postDecisionSemanticId` values through action, resolved, meaning, and Task 4 access without producing narrative evidence or changing the boss key. Source-policy tests reject a preview import of private answer keys, a preview-authored evidence/presentation-transition literal, a `correct` argument, a phase prop, a caller-authored challenge/response, or direct access issuance without the branded Task 3 reducer replay helper.

The browser tests enumerate all 40 scenes and all 112 option IDs from the catalogs. Each scene test opens its named replay recipe, requires its exact child labels/options, and asserts no `[data-private-answer]`, `[data-correct]`, `[data-expected-token]`, private key, correctness string, or inaccessible hidden answer exists. Separate split tests drive every option through pointer, touch, Enter, and Space, prove one callback-token path, visible persistent focus, at least 56 CSS px targets, at least 8 CSS px primary-control separation, stable option order, and identical no-answer-leak results. They use touch-enabled and non-touch contexts rather than treating a mouse click as touch.

- [ ] **Step 2: Lock the exact screenshot matrix and manifest in failing tests**

`tools/lib/soundSeekersV2GalleryManifest.mjs` exports a recursively frozen matrix in this exact kind order and canonical inner order:

1. `background-crop`: Task 5’s eight manifest records × profile order `landscape`, `tablet`, `portrait` = 24;
2. `chapter-map`: Task 1 chapter order = 8;
3. `scene-options`: Task 1 stop order = 40, whose `optionIds` union is exactly all 112 Task 3 option IDs;
4. `route-landmark`: Task 1 stop order = 40;
5. `wonder`: Task 1 chapter order = 8;
6. `boss-branch`: Task 1 chapter order, then each boss scene's two Task 3 child-option records in canonical option order = 16;
7. `character-pose`: Task 4 canonical character order `[...32 cast, player]` × `SOUND_SEEKERS_POSE_IDS` order = 330;
8. `meaning`: all `SOUND_SEEKERS_MEANING_VISUAL_OWNERS`, sorted by `meaningSemanticId`, each joined bijectively to the direct Task 4 meaning visual with that semantic ID;
9. `background-failure`: Task 5 manifest order = 8;
10. `creator-option`: Task 4 body-shape order, then palette order, then non-null accessory IDs in slot order `back`, `head`, `neck`, `held` and each slot’s canonical order;
11. `profile-viewport-zoom`: the exact eight cases below; and
12. `input-focus`: `pointer`, `touch`, `Enter`, `Space` = 4.

The profile cases are exactly `desktop-full-full`, `desktop-simplified-full`, `desktop-full-reduced`, `desktop-simplified-reduced`, `portrait-320x568`, `landscape-568x320`, `tablet-1194x834`, and `zoom-200-effective-320x568`. The last case creates a 640×1136 context at device scale factor 1, uses a Chromium CDP session to send `Emulation.setPageScaleFactor({pageScaleFactor:2})`, and asserts `visualViewport.scale === 2` and an effective 320×568 visual viewport before capture. CSS `zoom`, transforms, screenshot scaling, and device-pixel-ratio substitution are forbidden.

Let `creatorOptionCount` be exactly `bodyShapes.length + palettes.length + sum(accessoriesBySlot[slot].filter(value => value !== null).length)` across `back`, `head`, `neck`, and `held`, and let `meaningCount` be both `SOUND_SEEKERS_MEANING_VISUAL_OWNERS.length` and `SOUND_SEEKERS_MEANING_VISUALS.length` after exact semantic-ID bijection. The matrix cardinality is exactly `486 + creatorOptionCount + meaningCount`; the manifest stores that derived integer and rejects any other count. Matrix IDs and order are content-derived and unique. There is deliberately no implicit Cartesian product beyond the three explicit products above: background/profile, character/pose, and boss/branch.

All hashes use UTF-8 canonical JSON with recursively sorted object keys while preserving authoritative array order. `contentCatalogSha256` hashes the exact Task 1 expeditions/review/pronunciation invariant, Task 2 five catalogs/bindings/placements, and Task 3 child-scene/semantic/narrative-branch/meaning-owner registries. `visualCatalogSha256` hashes the exact Task 4 biome, scene, option, route, landmark, character, pose, direct-meaning visual, and story-outcome-capability catalogs. `creatorOptionsSha256` hashes only `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS`; `assetManifestSha256` hashes the exact parsed Task 5 JSON object. `gallerySourceGraphSha256` hashes a canonical sorted array of `{path,sha256}` for the complete transitive local source graph rooted at the checked-in shooter, gallery-manifest module, preview HTML/entry, replay recipes, gallery component, and gallery CSS. The graph resolver follows every static import, `export ... from`, `export * from`, literal dynamic `import()`, HTML module/script link, and CSS `@import`, includes the Task 1–5 modules reached by those edges, rejects an unresolved local specifier or non-literal local dynamic edge, and hashes exact file bytes rather than selected API projections. Adding/changing any renderer, replay, style, source-policy, or transitive local dependency therefore changes the graph hash and run ID. Functions, absolute paths, timestamps, dirty-text summaries, and object iteration order never enter these hashes.

The machine-readable `manifest.json` has this exact recursively validated shape and no extra keys:

```js
{
  schemaVersion: 1,
  status: "complete",
  runId,
  sourceHashes: {
    contentCatalogSha256,
    visualCatalogSha256,
    creatorOptionsSha256,
    assetManifestSha256,
    browserName: "chromium",
    browserVersion,
    gallerySourceGraphSha256
  },
  matrixSha256,
  shotCount,
  shots: [{
    ordinal, id, kind, relativePngPath, url, seed, fixtureId,
    chapterId, stopId, sceneId, subjectId, cropProfileId,
    densityProfile, motionProfile,
    viewport: { width, height },
    browserZoom,
    expectedCodeNativeSemanticIds,
    reviewBackdropSemanticIds,
    optionIds,
    asset: { path, sha256, cropRecordSha256 },
    png: { width, height, byteLength, sha256 },
    checks: {
      consoleErrors: [], pageErrors: [], failedRequests,
      visibleControlIds, focusTargetId, noAnswerLeak: true
    },
    status: "passed"
  }]
}
```

Fields not applicable to one shot kind are canonical `null` or frozen empty arrays; they are never omitted inconsistently. `reviewBackdropSemanticIds` may be non-empty only for `background-crop` records and is review metadata, not observed DOM. `expectedCodeNativeSemanticIds` must equal the observed code-native IDs for every rendered scene shot. Every PNG path is a safe relative child of its run directory; PNG dimensions equal its matrix viewport/crop contract; no orphan, duplicate, missing, symlinked, zero-byte, unmanifested, or extra PNG is allowed.

`checks.failedRequests` is exact, not a generic captured log. For each of the eight `background-failure` shots it is exactly one normalized record `{url:asset.path,method:"GET",reason:"route_abort"}` for that shot's Task 5 background and the browser must observe exactly one matching aborted request. For every other shot kind it is exactly `[]`. A second failure, failure of a different URL, non-GET request, browser/network failure not caused by the explicit route abort, missing abort, or a non-empty array on any normal shot invalidates the complete run. Expected background aborts therefore remain truthful manifest evidence without contradicting the empty-failure requirement for all normal screenshots.

Every `relativePngPath` is exactly `shots/${String(ordinal).padStart(4,"0")}-${id}.png`; matrix validation restricts `id` to lowercase ASCII letters, digits, and single hyphens, so no secondary slugger exists. `ordinal` is one-based and contiguous in matrix order. The file name, matrix ID, and manifest record must agree byte-for-byte.

`matrixSha256` hashes the canonical matrix. `soundSeekersV2GalleryRunId()` is the first 24 lowercase hexadecimal characters of SHA-256 over the canonical object `{schemaVersion:1,sourceHashes,matrixSha256}`; because `sourceHashes` includes the complete transitive `gallerySourceGraphSha256`, no gallery/render source change can reuse an old run ID. It contains no clock, random value, machine path, or git-dirty text. Rebuilding the same inputs in the same browser version produces byte-identical manifest JSON and run ID. Mutation tests cover every field, source-graph file/addition/removal/edge change, shot reorder/removal/addition, changed branch/semantic/option/crop/hash, wrong failed-request cardinality, wrong dimension, extra PNG, path traversal, a false `complete`, and a timestamp/random run ID.

- [ ] **Step 3: Run all new focused gates and confirm the intended red state**

Run:

```bash
node --test tests/unit/soundSeekersConnectedTextPresentation.test.js tests/unit/soundSeekersV2ContentGate.test.js tests/unit/soundSeekersVisualSemanticGate.test.js tests/unit/soundSeekersGalleryReplay.test.js tests/unit/soundSeekersV2GalleryManifest.test.js tests/unit/soundSeekersV2GalleryIsolation.test.js
node tools/checkSoundSeekersV2Content.mjs
node tools/checkSoundSeekersVisualSemantic.mjs
npx playwright test tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-gallery.spec.js --config=playwright.quest.config.js
```

Expected: FAIL for the missing Task 6 modules/gallery/scripts, not for a missing or dirty Task 1–5 dependency. Record that red evidence before implementation.

Static integration assertions must independently fail on:

- any stop/order/target drift from 40/103 or non-review teaching at `s8`/`s17`;
- a review stop without the canonical review source, a review candidate not taught strictly before that stop, nondeterministic replay/resume, or a non-review stop that resolves review targets;
- unresolved chapter, power, instruction, heart slot, scene, repair, relationship, consequence, pronunciation, meaning, narration, or Task 5 manifest foreign key;
- a first-use tutorial that records evidence, an untaught scored target/boss unit, or an invalid distractor/readable option;
- a high-frequency word used before introduction, absent from real slots, or with overlapping/incomplete regular/heart partitions;
- activity subtype loss, GPC fan-out, starvation, a missing/duplicate structural slot, a canonical coverage result other than exact 60/40/4/1/40 records, a heart inventory other than exact 80 visits/81 uses, valid-use counts other than exact 81/40/4/1/40, an all-correct final-event split other than 32/8, a resume mismatch, or incomplete four-activity heart-word coverage;
- ambiguous correctness/narrative metadata, an internal ID in child text, a fifth resident, or a missing relationship beat, Wonder, boss, repair, route, landmark, one of the 16 branch outcomes, or either distinct persistent branch consequence for a boss;
- any of the 112 options, 40 routes/landmarks, 32 cast plus player, ten poses, direct meaning IDs with their canonical owner/current capability, creator options, profile cases, input/focus cases, no-answer-leak cases, 24 crop records, 16 boss-branch cases, or eight failure cases absent from the matrix;
- a backdrop-review ID treated as code-native DOM, a code-native ID absent from DOM, a raw color outside `visualTokens.js` including CSS, an undeclared raster, a directory scan, or an asset/provenance/hash mismatch;
- any missing or extra instruction, scene-text, prompt, or meaning audio file/provenance record, or a text/hash/path/technical-profile mismatch; and
- a missing/extra background-failure abort, any failed request on a normal shot, an incomplete gallery source graph/run hash, or a production/offline import, re-export, literal/non-literal dynamic-load reference, HTML module edge, CSS import, or bundle reference to the gallery.

- [ ] **Step 4: Implement the pure validators and preserve the legacy aggregate**

Export pure assertion/validator functions from the two new tools and keep CLI exit handling in guarded main blocks. Only the two named validator functions accept complete cloned authorities for mutation testing; both public assertions import the canonical Task 1–5 modules. The content assertion calls the existing Task 1–5 validators, builds the real reducer-backed aggregate coverage fixture, passes its complete normalized `state` to Task 2 `validAttemptReceipts(state)`, `validContentDeckUses(state,category)`, and `coverageStatus(state)`, verifies the exact projections above, calls `assertSoundSeekersSceneAudio()`, and verifies an exact bijection between instruction contracts, instruction provenance, and instruction files. It does not infer pronunciation, eligibility, receipt validity, coverage, or correctness.

`buildSoundSeekersV2AuthoritySnapshot()` returns one recursively frozen data-only object with these exact keys: `questStops`, `chapters`, `expeditions`, `reviewSourceId`, `pronunciationInvariant`, `contentDeckCategories`, `contentDeckCatalogs`, `contentDeckBindings`, `contentDeckPlacements`, `coverageSummary`, `attemptReceiptSummary`, `connectedTextScenes`, `sceneVisualSemantics`, `narrativeBranchOutcomes`, `meaningSupport`, `meaningVisualOwners`, `instructionAudioInventory`, `sceneAudioInventory`, `biomeKits`, `sceneRenderSpecs`, `optionVisuals`, `meaningVisuals`, `routeSpecs`, `landmarkBindings`, `characterVisuals`, `playerVisual`, `creatorOptions`, `poseIds`, and `assetManifest`. Values are the imported canonical data or the derived canonical summary above; the snapshot contains no full state, raw evidence/receipt payload, resolver, evaluator, answer key, callback, renderer, machine-local path, or copied alternative authority. Mutation tests deep-clone only this snapshot and pass it to the two validators.

`assertSoundSeekersVisualSemantics()` imports Task 5’s parser, asserts exactly its eight ordered accepted records/eight file hashes/24 crop records, then joins them by exact chapter/path/provenance identity to Task 4. It validates raster backdrop metadata and code-native semantic catalogs as disjoint authorities. It does not scan `public/`, judge visual recognizability, mutate `SOURCE.md`, or change either null human-review field.

Extend `checkQuestIntegrity.js` and `scanSoundSeekersV2SourcePolicy()` to:

- call the v2 content assertion while retaining every legacy check until cutover;
- scan raw-color policy across `src/features/soundSeekers/content`, `engine`, `visual`, all three Task 6 preview source modules, and the Task 6 gallery CSS using `.js`, `.jsx`, `.mjs`, and `.css` extensions;
- allow v2 raw color literals only in `src/features/soundSeekers/visual/visualTokens.js`; and
- walk every repository-tracked/current `.js`, `.jsx`, `.mjs`, `.ts`, `.tsx`, `.html`, and `.css` source outside `.git`, `node_modules`, `.artifacts`, and generated build roots; parse static imports, `export ... from`, `export * from`, literal dynamic `import()`, HTML module/script links, and CSS `@import`; and reject any edge to Task 6 preview/gallery code from outside the exact Task 6 preview, shooter, manifest, and test consumers;
- reject a production-reachable non-literal dynamic import expression whose source text can resolve or concatenate a Task 6 preview/gallery path, and reject any gallery marker/path/module ID in the main production bundle, offline build, service-worker precache, or `/preview/quest.html`; and
- reject preview imports of private answer/evidence authorities. A static-import-only scan, named-import allowlist, or scan limited to the Sound Seekers subtree is insufficient production isolation.

Add scripts:

```json
"check:sound-seekers-content": "node tools/checkSoundSeekersV2Content.mjs",
"check:sound-seekers-art": "npm run check:sound-seekers-assets && node tools/checkSoundSeekersVisualSemantic.mjs",
"shots:sound-seekers-content": "node tools/shootSoundSeekersV2Content.mjs"
```

Task 5 remains the sole owner of `check:sound-seekers-assets`, its parser, prompts, assets, provenance, agent inspections, crop records, and human-review fields.

- [ ] **Step 5: Add deterministic complete-response warming and range-safe offline tests**

Add these exact media prefixes to `QUEST_MEDIA_PREFIXES`:

```js
"/game-assets/sound-seekers/v2/",
"/audio/quest-v2/"
```

Do not precache media into the executable shell. `tests/quest-offline/quest-offline.spec.js` imports Task 5’s parser in Node test scope and constructs the background warm list from its exact eight ordered `assets[].path` values. It adds one exact instruction and one exact scene narration selected from their canonical provenance—not a literal invented path—and records all ten expected SHA-256 values. The browser sends one `LP_WARM_QUEST_ASSETS` request, requires `requested === completed === 10` and `failed === 0`, and verifies the media cache contains those ten URLs and no unknown v2 URL.

While online, and again after a page close/reopen with the context offline, fetch all ten warmed URLs as complete status-200 bodies and compare `crypto.subtle.digest("SHA-256", bytes)` to provenance. A Range request for a warmed background and warmed MP3 must be answered from the cached complete body with status 200 and the same full hash. A separate canonical but deliberately unwarmed MP3 Range request must receive a genuine 206 with exact `Content-Range`, must not create a CacheStorage entry, and must fail offline instead of treating a partial body as complete.

Because the existing Vite preview server may answer a range with 200, `tools/serveQuestOfflineRangeTest.mjs` is the deterministic loopback-only static server for the exact absolute root in `QUEST_OFFLINE_DIST`. It refuses a missing/relative/root/home/project/worktree path, accepts only GET/HEAD below the validated non-symlink directory, rejects traversal/symlinks, sets MIME/length/`Accept-Ranges`, returns a standards-compliant single-range 206/416, and otherwise returns the complete file. Change only the existing package entry to `"serve:quest-offline-test": "node tools/serveQuestOfflineRangeTest.mjs --root-env QUEST_OFFLINE_DIST --host 127.0.0.1 --port 5191"`; retain the existing Playwright config. Bound startup and shutdown and terminate on signals. This is test infrastructure, not a production server.

Implement `tools/shootSoundSeekersV2Content.mjs --create-build-root` before running this step. It uses `mkdtemp()` only under the operating-system temporary directory with prefix `literacypath-sound-seekers-task6-build-`, writes one `0600` `.sound-seekers-task6-owned.json` marker containing exact `{schemaVersion:1,kind:"sound_seekers_task6_build_root",rootRealpath,device,inode}`, fsyncs marker and directory, and prints only the absolute root. It refuses a symlink, nonempty reused directory, project/worktree/home/root location, or marker mismatch. `--clean-build-root <absolute-root>` revalidates the prefix, OS-temp parent, marker schema, exact realpath/device/inode, and non-symlink root before removing that one exact root; it refuses any unowned path. These two bounded modes share no screenshot behavior and are the only Task 6 build-root creation/deletion path.

`checkQuestOffline.mjs` continues accepting `QUEST_OFFLINE_DIST` and additionally asserts both v2 prefixes are present, no v2 media leaked into the shell precache, and the content gallery HTML/module is absent from the offline build and precache. Run the checker against the build just created:

Run from one shell so the fresh task-owned root is always cleaned by the validated mode:

```bash
task6_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
QUEST_RELEASE_PREVIEW=true npx vite build --outDir "$task6_build_root/offline"
QUEST_OFFLINE_DIST="$task6_build_root/offline" npm run check:quest-offline
QUEST_OFFLINE_DIST="$task6_build_root/offline" npm run test:quest-offline -- --grep "Sound Seekers v2 media"
node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$task6_build_root"
```

Expected: PASS for all eight exact background bytes, both exact audio bytes, warmed complete-response reuse, genuine unwarmed 206 non-caching, gallery exclusion, and validated removal of only the fresh task-owned OS-temporary build root. If any command before cleanup fails, run the same validated `--clean-build-root "$task6_build_root"` command before leaving the step; never substitute `rm`, a glob, a project-root output directory, or an unmarked pre-existing directory. This is a loopback Chromium/offline-harness gate, not physical-iPad proof.

- [ ] **Step 6: Implement the reducer-backed gallery and exhaustive browser matrix**

`parseSoundSeekersGalleryQuery()` accepts only `mode`, `stop`, `scene`, `fixture`, `density`, `motion`, `labels`, `seed`, and `option`, validates every value against canonical catalogs, and rejects unknown/duplicate keys. `replaySoundSeekersGalleryFixture()` obtains the real child view and, for any post-choice recipe, executes the exact wrong/correction/complete-state-plus-presentation serialization/rehydration/model-if-third/fresh-challenge/correct/action/resolved sequence locked in Step 1. It calls Task 2 `materializeStoryTransferChallenge()` as the sole challenge producer for all 40 stops; Task 3 `createConnectedTextChallenge()` may only return the object-identical non-boss challenge after verification, and `materializeBossTransferChallenge()` may only return the object-identical boss delegate. Every simulated response token comes from that exact current challenge object, which never reaches JSX. Resume normalizes the complete Task 2 state with evidence/receipts/checkpoint, rehydrates the strict Task 3 checkpoint, invalidates every old presentation/transition/access, and reissues only from a fresh exact-current transition. The JSX receives only the child-safe view, reducer context/current capability, crop/density/motion, and child-safe callback.

The gallery uses the real Task 4 `SceneVisual`, `LayeredBiome`, `Landmark`, `SoundSeekersCharacter`, and `SoundSeekersCharacterCreator`. It never introduces a preview renderer, second crop solver, meaning alias, answer key, or alternate option catalog. Creator mode iterates `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS`, maps accessories through their canonical slots, round-trips the exact appearance through serialize/deserialize, and passes that same normalized object to preview and world. Tests compare canonical serialized strings, signatures, visible selection, focus, and the rendered part inventory. Customization remains cosmetic and cannot mutate curriculum, challenge, evidence, support, difficulty, reward, or route fixtures.

Browser tests split by stop, inventory kind, input mode, and profile so no test performs an unbounded 40-page navigation loop. They cover every matrix identity, but do not multiply unrelated axes beyond the locked matrix. For each of the eight background-failure records, install one exact URL route abort before navigation, require exactly one matching GET failure, and prove the full route, resident, landmark/current state, all options, label, focus, and activation remain visible and usable; every normal shot must observe zero failed requests. For each crop record, use Task 4 `computeBackgroundCrop()` and the exact Task 5 target size/retained rectangle; record backdrop IDs only for later raster review.

Meaning coverage is reachability, not catalog presence. For every exact `SOUND_SEEKERS_MEANING_VISUAL_OWNERS` record, the test starts the named owner scene and, when its owner is one of two boss branches, checkpoints exactly the child option whose token resolves to that owner post-decision semantic. It completes the current canonical Task 2 challenge, obtains the Task 3 action transition, advances to resolved, sends `meaning_requested` with only the owner's `meaningSemanticId`, and issues a Task 4 capability from that exact-current meaning transition. The access must validate and resolve the object-identical Task 4 direct meaning visual; its scene/post-decision/meaning/story-outcome identities must equal the owner and selected branch. Advancing, rehydrating, closing, or beginning the next owner scene must invalidate that access. The visited meaning-ID set must equal both the full owner set and full direct-meaning visual set exactly once, proving every meaning is reachable through a canonical owner/current capability with no alias, forged phase, or direct resolver shortcut.

For each boss scene, repeat the completed/reload path for both child options. Require the selected token to appear first only in the Task 2 checkpoint, then byte-identically in both final reciprocal uses; require it absent from the boss challenge, response, evidence, and receipt; and require Task 3/Task 4 action, resolved, and meaning projections/access to retain the matching persistent `storyOutcomeId` and branch-specific post-decision semantic after reload. The two branches must remain distinct and neither may alter the canonical boss challenge/key or create narrative evidence.

- [ ] **Step 7: Implement the bounded, atomic screenshot runner**

`shootSoundSeekersV2Content.mjs` consumes the exact matrix and Task 5 parser, resolves/hashes the complete transitive gallery source graph defined in Step 2 before deriving `runId`, and fails rather than reuse a run when any graph edge/file cannot be proven current. It starts one strict-port loopback Vite dev server in a detached process group and uses these hard ceilings: server readiness 45 seconds, navigation 30 seconds, gallery-ready signal 15 seconds, fonts 5 seconds, images 10 seconds, screenshot 15 seconds, one matrix record 45 seconds, browser close 10 seconds, and server termination 10 seconds. Every wait is raced against its ceiling. `try/finally` always closes page/context/browser and terminates the whole process group; `SIGINT`, `SIGTERM`, navigation failure, image hang, and screenshot failure follow the same cleanup path. Its independent `--create-build-root`/`--clean-build-root` modes implement the marker/device/inode contract in Step 5 and never start a browser or server.

The runner writes only to `.artifacts/sound-seekers-v2/content-gallery/<run-id>.partial/`, validates every PNG and complete manifest, fsyncs the manifest, then atomically renames the directory to `<run-id>/`. On failure it removes only that exact partial directory and exits nonzero. On startup it removes only an exact same-run partial directory; an existing complete run is accepted only if `assertSoundSeekersV2GalleryManifest()` and every PNG hash pass, otherwise the tool fails without overwrite. `--check <run-id>` is read-only; `--clean-partials <run-id>` removes only that validated exact partial path. Extra/orphan PNGs or a complete directory without a valid complete manifest fail.

The runner uses fixed seed 11 and disables nonessential motion. It captures console/page errors, controls, focus, observed code-native IDs, no-answer-leak result, raster review metadata, and PNG facts before constructing the strict manifest. It normalizes failed requests only after matching browser request/requestfailed events: exactly the one intentional asset GET abort for a `background-failure` shot, and none for every other shot. It fails on an unplanned console/page/network failure instead of hiding it in a nonempty array. The CDP zoom case verifies the actual visual viewport scale/size; no CSS/DPR proxy is accepted. The completed ignored run is mechanical/agent evidence retained for direct review; it contains no human-approval field and is never copied into `docs/` or staged.

- [ ] **Step 8: Run the complete static, generated, unit, rendered, offline, isolation, build, and screenshot gates**

Run generated-source and exact media checks first:

```bash
node tools/buildSoundSeekersPronunciationLexicon.mjs
node tools/buildSoundSeekersConnectedTextUsage.mjs
node tools/checkSoundSeekersSceneAudio.mjs
npm run check:sound-seekers-content
npm run check:sound-seekers-art
npm run check:public-media-policy
git diff --exit-code -- src/features/soundSeekers/content/pronunciationRecords.js src/features/soundSeekers/content/pronunciationCorpusInvariant.generated.js src/features/soundSeekers/content/connectedTextUsage.generated.js src/data/generated/audioFilePaths.generated.js src/data/generated/audioQuestPaths.generated.js
```

Run every focused Task 1–6 unit gate, including the exact instruction/audio and generated-source tests:

```bash
node --test \
  tests/unit/soundSeekersInstructionContracts.test.js \
  tests/unit/soundSeekersTeachSequence.test.js \
  tests/unit/soundSeekersAudioDelivery.test.js \
  tests/unit/soundSeekersExpeditions.test.js \
  tests/unit/soundSeekersReviewSequences.test.js \
  tests/unit/soundSeekersPronunciationLexicon.test.js \
  tests/unit/questSequence.test.js \
  tests/unit/questBlueprint.test.js \
  tests/unit/soundSeekersHeartWords.test.js \
  tests/unit/soundSeekersContentDecks.test.js \
  tests/unit/soundSeekersContentTransactions.test.js \
  tests/unit/soundSeekersContentCoverage.test.js \
  tests/unit/runSoundSeekersContentDeckSqlSelftest.test.js \
  tests/unit/soundSeekersEvidence.test.js \
  tests/unit/soundSeekersEvidenceEligibility.test.js \
  tests/unit/soundSeekersStateV2.test.js \
  tests/unit/progressMerge.test.js \
  tests/unit/soundSeekersConnectedText.test.js \
  tests/unit/soundSeekersConnectedTextPresentation.test.js \
  tests/unit/soundSeekersConnectedTextGenerator.test.js \
  tests/unit/soundSeekersMeaningSupport.test.js \
  tests/unit/soundSeekersCastArcs.test.js \
  tests/unit/soundSeekersSceneAudio.test.js \
  tests/unit/soundSeekersBiomeKits.test.js \
  tests/unit/soundSeekersSceneVisualCatalog.test.js \
  tests/unit/soundSeekersSceneVisualAccess.test.js \
  tests/unit/soundSeekersVisualSemantic.test.js \
  tests/unit/soundSeekersCharacterCreator.test.js \
  tests/unit/soundSeekersAssetManifest.test.js \
  tests/unit/soundSeekersV2ContentGate.test.js \
  tests/unit/soundSeekersVisualSemanticGate.test.js \
  tests/unit/soundSeekersGalleryReplay.test.js \
  tests/unit/soundSeekersV2GalleryManifest.test.js \
  tests/unit/soundSeekersV2GalleryIsolation.test.js
node tools/runSoundSeekersContentDeckSqlSelftest.mjs
```

Run browser, offline, production-isolation, lint, quest, and screenshot gates:

```bash
npx playwright test tests/browser/sound-seekers-visual-fallback.spec.js --project=desktop
npx playwright test tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-gallery.spec.js --config=playwright.quest.config.js
task6_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
QUEST_RELEASE_PREVIEW=true npx vite build --outDir "$task6_build_root/offline"
QUEST_OFFLINE_DIST="$task6_build_root/offline" npm run check:quest-offline
QUEST_OFFLINE_DIST="$task6_build_root/offline" npm run test:quest-offline -- --grep "Sound Seekers v2 media"
npm run check:quest
npm run lint
ANALYZE_BUNDLE=true npx vite build --outDir "$task6_build_root/production"
node tools/checkSoundSeekersV2Content.mjs --production-bundle "$task6_build_root/production/bundle-analysis.json"
npm run shots:sound-seekers-content
node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$task6_build_root"
git diff --check
```

`shots:sound-seekers-content` validates every PNG and the complete manifest before its atomic rename; it prints the exact validated content-addressed run ID for review or a later read-only `--check` call. Expected: all automated gates pass, the generated-source check leaves the exact Task 1/3 generated files byte-identical, the production bundle/offline shell contain no gallery import/re-export/dynamic-import/module/path/marker, the complete source-graph-derived current screenshot manifest validates with exact matrix/PNG/failure hashes, and the validated cleanup removes only the fresh marked OS-temporary build root. If a command fails after root creation, run the same exact `--clean-build-root "$task6_build_root"` command before leaving the step; an uncleaned owned build root is a failed gate.

Open the 24 raster crop PNGs and the remaining current-run screenshots at original detail and record only what was mechanically/directly inspected. Do not update Task 5 `humanReviews`, Task 3 `humanListeningReview`, or the global app-visual-review authority. Passing automation or agent inspection is not human crop approval, semantic recognizability, narration listening approval, assistive-technology approval, physical-device behavior, child comprehension, hosted persistence, deployment, or production readiness.

- [ ] **Step 9: Clean scoped temporary outputs, stage exactly 22 paths, inspect, and commit**

The screenshot tool has already removed its exact partial directory in `finally`, and Step 8's validated `--clean-build-root` call has removed the one marked OS-temporary build root. Preserve the one complete ignored current screenshot run for review. Confirm the recorded task build root no longer exists and that this task never created repository `dist/` or `dist-quest-offline/`; if either pre-existed, it was rejected at preflight and remains untouched. Confirm there is no partial run, orphan PNG, trace, rejected screenshot, temp manifest, dev server, or occupied test port. Do not glob or delete any other `.artifacts` content or a previous valid review run.

```bash
git add -A -- tools/checkSoundSeekersV2Content.mjs tools/checkSoundSeekersVisualSemantic.mjs tools/lib/soundSeekersV2GalleryManifest.mjs tools/checkQuestIntegrity.js tools/viteQuestOfflinePlugin.mjs tools/checkQuestOffline.mjs tools/serveQuestOfflineRangeTest.mjs preview/sound-seekers-v2-content.html preview/sound-seekers-v2-content.jsx src/features/soundSeekers/preview/galleryReplayRecipes.js src/features/soundSeekers/preview/ContentArtGallery.jsx src/features/soundSeekers/preview/content-art-gallery.css tools/shootSoundSeekersV2Content.mjs tests/unit/soundSeekersV2ContentGate.test.js tests/unit/soundSeekersVisualSemanticGate.test.js tests/unit/soundSeekersGalleryReplay.test.js tests/unit/soundSeekersV2GalleryManifest.test.js tests/unit/soundSeekersV2GalleryIsolation.test.js tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-gallery.spec.js tests/quest-offline/quest-offline.spec.js package.json
git diff --cached --name-status
git diff --cached --check
git diff --cached -- package.json
git commit -m "test: gate Sound Seekers content and art"
```

The cached list must contain exactly the 22 paths above and nothing else. The `package.json` diff adds only `check:sound-seekers-content`, `check:sound-seekers-art`, and `shots:sound-seekers-content`, and changes only `serve:quest-offline-test` to the deterministic `QUEST_OFFLINE_DIST` range server. The cache must not contain this plan, any Task 1–5 file, a production route/Vite input, Task 5 asset/SOURCE/provenance, Task 3 audio/human-review data, `.artifacts`, any build root, a screenshot, a trace, or a generated source.

## Completion boundary

This plan is complete only when Tasks 1–6 and every automated gate stated above pass, generated sources are current, the exact content-addressed screenshot run validates, and Task 6’s scoped cleanup/staging boundary is clean. The following remain independent direct gates and must be reported separately: human listening of instruction and 40 scene recordings; human crop and semantic review; assistive-technology review; formative child testing; physical-iPad Safari behavior; authenticated hosted persistence; deployment; and production operation.

The next implementation plan is `docs/superpowers/plans/2026-09-01-sound-seekers-v2-game-runtime.md`. It consumes this plan's validated outputs and is the first place that may claim production-route reachability or six-power gameplay behavior.
