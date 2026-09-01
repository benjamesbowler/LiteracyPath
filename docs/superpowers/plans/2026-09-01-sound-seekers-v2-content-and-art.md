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
- Create: `src/features/soundSeekers/content/contentDeckCatalogs.js`
- Create: `src/features/soundSeekers/engine/contentDeckScheduler.js`
- Create: `src/features/soundSeekers/engine/contentCoverage.js`
- Modify: `src/features/soundSeekers/engine/challengeContract.js`
- Modify: `src/features/soundSeekers/engine/evidence.js`
- Modify: `src/features/soundSeekers/engine/stateV2.js`
- Create: `supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql`
- Create: `supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql`
- Create: `tests/unit/soundSeekersHeartWords.test.js`
- Create: `tests/unit/soundSeekersContentDecks.test.js`
- Create: `tests/unit/soundSeekersContentCoverage.test.js`
- Modify: `tests/unit/soundSeekersEvidence.test.js`
- Modify: `tests/unit/soundSeekersStateV2.test.js`
- Modify: `tests/unit/progressMerge.test.js`

`heartWordRecords.js` and `contentDeckRecords.js` are pure authored sources that generators may import without importing generated pronunciation modules. `heartWords.js` validates high-frequency-word records against the shipping pronunciation/meaning APIs. `contentDeckCatalogs.js` joins all five category catalogs to Task 1 structural slots and is the only runtime catalog registry; category-specific code must not build a second eligibility list.

**Interfaces:**
- Consumes: the exact unique `QUEST_STOPS.flatMap(stop => stop.heartWords)` set, Task 1 `CONTENT_DECK_SLOT_IDS`, `getPronunciation`, `getWordMeaning`, journey step, and v2 `contentDecks`.
- Produces: `HEART_WORD_RECORDS`, `SOUND_SEEKERS_HEART_WORDS`, `HEART_WORD_ACTIVITY_TYPES`, `CONTENT_DECK_CATEGORIES`, `SOUND_SEEKERS_CONTENT_DECK_CATALOGS`, `getContentDeckCatalog(category)`, `createContentDeckState(raw)`, `serveContentDeck(state,{category,slotId,stopId,journeyStep,seed,requiredActivityType})`, `recordContentDeckUse(state,result)`, `checkpointContentDecks(state)`, `resumeContentDecks(checkpoint)`, `coverageStatus(state)`, and merge-safe `contentDecks.{heartWords,stories,alternatives,morphology,transfer}`.
- `contentDeckRecords.js` authors the non-high-frequency records: one `stories` opportunity per connected-text ID/structural story slot; audited alternative-pronunciation applications keyed to canonical target/comparison-family metadata; morphology applications keyed to the exact taught morpheme and controlled word; and transfer applications keyed to an expedition's authored transfer slot, connected text or boss word, power, and legitimate domain. Every record declares `id`, `category`, `introductionStopId`, structural `slotIds`, `activityTypes`, `contentId`, and the exact consumer contract. Derived legacy spelling or free-form content objects are forbidden.
- Category consumers are fixed now and tested again in the runtime plan:

| Deck category | Authored producer | Runtime consumer |
|---|---|---|
| `heartWords` | `heartWordRecords.js` + `heartWords.js` | `createMissionPlan.js` supplies `memoryDelivery.js`; all four activity types have distinct authored interaction contracts |
| `stories` | `contentDeckRecords.js` IDs, enriched/validated by Task 3 `connectedText.js` | `createMissionPlan.js` supplies `storyPower.js` |
| `alternatives` | `contentDeckRecords.js` audited alternative records | `createChallenge.js` supplies `contrastSort.js` |
| `morphology` | `contentDeckRecords.js` controlled morpheme/word records | `createChallenge.js` supplies `wordForge.js` without treating a morpheme as a phoneme |
| `transfer` | `contentDeckRecords.js` expedition transfer records | `createMissionPlan.js` routes to the record's named power/domain, including authored bosses |

- The scheduler owns selection, recording, checkpoint, and resume for every category. A result contains `category`, `recordId`, `activityType`, `slotId`, `visitId`, `journeyStep`, and `nextState`; `recordContentDeckUse()` rejects a result from another category/slot or a repeated visit ID. `checkpointContentDecks()` returns only the normalized five-category persisted projection. `resumeContentDecks()` accepts missing older-v2 categories as empty, rejects arbitrary nested fields, and must produce the same next serve for the same seed and journey step.
- Produces a forward-only SQL migration after `20260901120000_sound_seekers_learning_v2.sql`. It adds `public.lp_quest_normalize_v2_activity_type(jsonb)`, `public.lp_quest_merge_v2_deck_record(jsonb,jsonb)`, and `public.lp_quest_merge_v2_deck(jsonb,jsonb)`, then replaces the evidence-union and learning-merge functions so all five deck categories use the same field-aware merge and valid activity subtypes survive. Never rewrite the already committed foundation migration.
- Canonical record:

```js
{
  id: "hw:a",
  display: "a",
  pronunciationId: "a",
  meaningId: "a-meaning",
  regularParts: [],
  heartParts: [0],
  introductionStopId: "s1",
  introductionSlotId: "heart-slot-s1-1",
  eligibleActivityTypes: ["recognition", "heart_part_mapping", "encoding", "sentence_use"]
}
```

`regularParts` and `heartParts` contain canonical pronunciation-unit indices, not duplicated grapheme/sound-key records.

- [ ] **Step 1: Write failing mapping, schedule, evidence, and merge tests**

```js
test("the canonical sixty words are partitioned truthfully", () => {
  const declared = new Set(QUEST_STOPS.flatMap(stop => stop.heartWords.map(word => word.toLowerCase())));
  assert.equal(declared.size, 60);
  assert.equal(SOUND_SEEKERS_HEART_WORDS.length, 60);
  assert.deepEqual(new Set(SOUND_SEEKERS_HEART_WORDS.map(item => item.display)), declared);

  for (const record of SOUND_SEEKERS_HEART_WORDS) {
    const pronunciation = getPronunciation(record.pronunciationId);
    assert.ok(pronunciation, record.id);
    assert.equal(record.meaningId, pronunciation.meaningId);
    assert.ok(record.regularParts.length + record.heartParts.length > 0, record.id);
    assert.equal(new Set([...record.regularParts, ...record.heartParts]).size, pronunciation.units.length, record.id);
    assert.deepEqual(
      [...record.regularParts, ...record.heartParts].sort((a, b) => a - b),
      pronunciation.units.map((_, index) => index)
    );
    assert.equal(record.heartParts.every(index => pronunciation.units[index].role === "irregular"), true, record.id);
    assert.equal(record.regularParts.every(index => pronunciation.units[index].role !== "irregular"), true, record.id);
  }
  assert.equal(SOUND_SEEKERS_HEART_WORDS.find(item => item.id === "hw:a").regularParts.length, 0);
  assert.equal(SOUND_SEEKERS_HEART_WORDS.find(item => item.id === "hw:and").heartParts.length, 0);
});

test("introductions use real expedition slots and never exceed two per stop", () => {
  for (const stop of QUEST_STOPS) {
    const introduced = SOUND_SEEKERS_HEART_WORDS.filter(item => item.introductionStopId === stop.id);
    assert.ok(introduced.length <= 2, stop.id);
    for (const record of introduced) {
      assert.ok(getExpedition(stop.id).heartWordSlotIds.includes(record.introductionSlotId), record.id);
    }
  }
});

test("the authored eighty-opportunity catalog schedule covers all sixty and all four activities", () => {
  let decks = createContentDeckState();
  const served = new Set();
  const activities = new Set();
  const visits = new Set();
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    for (const [slotIndex, opportunity] of expedition.heartWordOpportunities.entries()) {
      assert.deepEqual(
        pickDecisionTuple(opportunity),
        ["memory-delivery-deliver-heart-word", "memory_delivery", "deliver_heart_word_cue", "heart_word_mapping"]
      );
      const result = serveContentDeck(decks, {
        category: "heartWords",
        slotId: opportunity.slotId,
        stopId: expedition.stopId,
        journeyStep: expedition.stopIndex,
        seed: expedition.stopIndex * 10 + slotIndex
      });
      assert.ok(result, opportunity.id);
      served.add(result.recordId);
      activities.add(result.activityType);
      visits.add(result.visitId);
      decks = recordContentDeckUse(decks, result);
    }
  }
  assert.equal(visits.size, 80);
  assert.equal(served.size, 60);
  assert.deepEqual(activities, new Set(HEART_WORD_ACTIVITY_TYPES));
});

test("all five authored catalogs are structural and exhaust before repeat", () => {
  assert.deepEqual(CONTENT_DECK_CATEGORIES, [
    "heartWords", "stories", "alternatives", "morphology", "transfer"
  ]);
  for (const category of CONTENT_DECK_CATEGORIES) {
    const catalog = getContentDeckCatalog(category);
    assert.ok(catalog.length > 0, category);
    for (const record of catalog) {
      assert.equal(record.category, category);
      assert.ok(record.slotIds.length > 0, record.id);
      assert.equal(record.slotIds.every(slotId => CONTENT_DECK_SLOT_IDS[category].includes(slotId)), true);
    }
    assertSeededCatalogCycleCoversEveryEligibleRecordBeforeRepeat(category, catalog);
  }
});

test("the unlocked heart-word cycle covers every word/activity pair before repeating a pair", () => {
  const expectedPairs = new Set(SOUND_SEEKERS_HEART_WORDS.flatMap(word =>
    word.eligibleActivityTypes.map(activityType => `${word.id}:${activityType}`)
  ));
  const observed = serveUnlockedCycle({
    category: "heartWords",
    calls: expectedPairs.size,
    seed: 29
  }).map(result => `${result.recordId}:${result.activityType}`);
  assert.equal(new Set(observed).size, expectedPairs.size);
  assert.deepEqual(new Set(observed), expectedPairs);
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

test("heart-word activity subtype survives the child challenge and evidence boundary", () => {
  const challenge = heartWordChallenge({ activityType: "encoding" });
  assert.equal(toChildChallengeView(challenge).activityType, "encoding");
  const event = createLiteracyDecision(validDecisionInput(challenge));
  assert.equal(event.domain, "heart_word_mapping");
  assert.equal(event.activityType, "encoding");
  assert.notEqual(event.domain, "phoneme_to_grapheme");
});

test("concurrent content-deck activity records merge without losing either branch", () => {
  const local = stateWithHeartWordVisit("hw:the", "recognition", "visit-local");
  const remote = stateWithHeartWordVisit("hw:the", "encoding", "visit-remote");
  const merged = mergeSoundSeekersStates(local, remote);
  assert.deepEqual(
    merged.contentDecks.heartWords["hw:the"].visitIds.sort(),
    ["visit-local", "visit-remote"]
  );
  assert.deepEqual(
    Object.keys(merged.contentDecks.heartWords["hw:the"].activityLastServed).sort(),
    ["encoding", "recognition"]
  );
});

test("the forward SQL merge owns every v2 deck and preserves activity subtype", () => {
  const migration = readFileSync(
    "supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql",
    "utf8"
  );
  for (const category of ["heartWords", "stories", "alternatives", "morphology", "transfer"]) {
    assert.match(migration, new RegExp(`'${category}'[\\s\\S]*lp_quest_merge_v2_deck`));
  }
  assert.match(migration, /activityLastServed/u);
  assert.match(migration, /visitIds/u);
  assert.match(migration, /activityType/u);
});
```

- [ ] **Step 2: Run the deck/state tests and confirm the red state**

Run:

```bash
node --test tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js
```

Expected: FAIL because the five catalogs, generic scheduler/record/resume API, activity subtype, two extra persisted deck categories, and merge behavior do not exist.

- [ ] **Step 3: Implement the records, deterministic scheduler, and explicit state merge**

Author exactly 60 records. Spread one or two new introductions across the 40 stops; do not require two new words at every stop. Move `a` to `s1` so the first controlled phrase may use it. A word is eligible only at or after its introduction stop.

Author and validate every non-heart-word catalog record in `contentDeckRecords.js`. Story records must bijectively cover Task 1 `CONNECTED_TEXT_IDS` and story slots even though Task 3 supplies their final text. Alternative records must point to a canonical authored alternative target and a same-family contrast; morphology records must name a canonical morpheme plus a controlled word/pronunciation record; transfer records must point to the exact expedition transfer slot, content ID, power, and domain. Reject any record without a real Task 1 slot, any slot claimed twice within a category, any stop before introduction, any alternative/morphology item inferred from spelling, or any transfer domain inconsistent with its authored power.

Classify parts from the canonical pronunciation record, not from whether the child has encountered that correspondence yet: a canonical unit whose role is exactly `irregular` belongs in `heartParts`; every other canonical unit belongs in `regularParts`. Unknown does not mean irregular. If linguistic review requires changing a unit's role, change the generator's authoritative pronunciation source and regenerate first; do not override it in the high-frequency-word deck.

The generic scheduler applies this selection order within the requested category and structural slot:

1. Eligible, never-served introductions assigned to the current slot.
2. Due activity subtype for an introduced record (for heart words this is the least-served of the record's exact `eligibleActivityTypes`).
3. Least-recently served eligible record/activity pair.
4. `null` only when no eligible content exists.

Ties are resolved by a stable seeded shuffle over canonical record IDs, slot ID, journey step, and category. Same inputs reproduce exactly; changing a seed must provide bounded coverage. For each non-heart-word category, every eligible record must be served before the first repeat. For `heartWords`, the authored 80-opportunity catalog schedule must serve every canonical word and expose all four activity types; after all words unlock, a cycle of `sum(word.eligibleActivityTypes.length)` calls must cover every eligible `(wordId,activityType)` pair before repeating one. Tests derive all bounds from the catalogs and run the cycle over a broad deterministic seed set; they do not embed catalog-size constants.

This task's scheduler test proves authored catalog coverage, not production reachability. Runtime Task 3 must drive the actual mission planner and reducers through all 40 stops, visibly enter and complete all 80 `content_opportunity` subphases, record all 80 unique deck visits and their practice decisions, cover all 60 words and four activity types, and prove each surrounding authored challenge retains its original power/decision tuple.

Persist stable visit IDs and merge them by set union. Merge `firstServedStep` by the earliest positive value, `lastServedStep` by maximum, `activityLastServed` key-by-key by maximum, and `visitIds` by unique union:

```js
function mergeDeckRecord(local = {}, remote = {}) {
  const positive = [local.firstServedStep, remote.firstServedStep].filter(value => Number(value) > 0);
  return {
    firstServedStep: positive.length ? Math.min(...positive) : null,
    lastServedStep: Math.max(Number(local.lastServedStep) || 0, Number(remote.lastServedStep) || 0),
    activityLastServed: mergeNumberMaps(local.activityLastServed, remote.activityLastServed),
    visitIds: mergeIds(local.visitIds, remote.visitIds)
  };
}
```

Add `activityType` to the child-safe challenge-field allowlist. Require one of the four `HEART_WORD_ACTIVITY_TYPES` when `recordsDomain` is `heart_word_mapping`; reject it on other domains unless a later authority defines that domain's own subtype. Copy it unchanged into the single literacy-decision event. Do not derive parallel GPC events from a high-frequency-word response.

Add `morphology` and `transfer` to state creation, normalization, and merge while keeping older v2 saves valid when either key is absent. `createContentDeckState`, `checkpointContentDecks`, and `resumeContentDecks` are the category-schema authority used by `stateV2`; do not maintain separate normalizers. Normalize nested records rather than accepting arbitrary objects. Apply `mergeDeckRecord` independently to every word/story/alternative/morphology/transfer record on both branches; do not use the old shallow `mergeRecords` for nested deck records.

Add the forward migration in this task, not in cutover. `lp_quest_normalize_v2_activity_type` preserves `activityType` only for `heart_word_mapping` events whose value is one of the four exact activity types, removes it from unrelated domains, and never rewrites the event's domain. Re-issue `lp_quest_union_v2_evidence` so both branches pass through that helper before ID dedupe. `lp_quest_merge_v2_deck_record` must mirror the client rule exactly: earliest positive `firstServedStep`, maximum `lastServedStep`, key-wise maximum `activityLastServed`, unique sorted union of `visitIds`, and deterministic preservation of allowlisted scalar subtype fields. `lp_quest_merge_v2_deck` applies that record helper key-by-key. Re-issue `lp_quest_merge_learning_v2` with `heartWords`, `stories`, `alternatives`, `morphology`, and `transfer` all delegated to the helper; preserve the existing reset, assignment, checkpoint, settings, journal, reward, grants, and revokes unchanged.

The SQL self-test must execute both merge directions plus A/B/C regrouping and assert that neither branch loses a deck record. Its fixture contains all five categories and all four heart-word activity subtypes (`recognition`, `heart_part_mapping`, `encoding`, `sentence_use`) in both `activityLastServed` and immutable evidence events. Assert `activityType` remains unchanged and no `heart_word_mapping` event becomes a GPC event. `tests/unit/progressMerge.test.js` statically requires the helper definitions, five category calls, self-test vectors, and grants; the cutover plan later runs client/SQL parity against the same exhaustive vectors.

- [ ] **Step 4: Run 1,000 seeded journeys, activity separation, merge, and resume fixtures**

Run:

```bash
node --test tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js
```

Expected: PASS for all seeds with the authored 80-opportunity schedule covering all 60 by stop 40, all four heart-word activity types represented, every derived unlocked word/activity pair and every eligible non-heart catalog record covered before repeat, independent activity subtype histories, no GPC fan-out, all five concurrent branches retained, and identical continuation after checkpoint restore. Do not call this production-reachable until the later real mission simulation passes.

- [ ] **Step 5: Commit the complete high-frequency-word journey**

```bash
git add src/features/soundSeekers/content/heartWordRecords.js src/features/soundSeekers/content/heartWords.js src/features/soundSeekers/content/contentDeckRecords.js src/features/soundSeekers/content/contentDeckCatalogs.js src/features/soundSeekers/engine/contentDeckScheduler.js src/features/soundSeekers/engine/contentCoverage.js src/features/soundSeekers/engine/challengeContract.js src/features/soundSeekers/engine/evidence.js src/features/soundSeekers/engine/stateV2.js supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js
git commit -m "feat: complete the Sound Seekers word coverage journey"
```

### Task 3: Author 40 connected scenes, generated meaning support, narration, and relationship arcs

**Files:**
- Create: `src/features/soundSeekers/content/connectedTextRecords.js`
- Create: `src/features/soundSeekers/content/connectedText.js`
- Create: `src/features/soundSeekers/content/castArcs.js`
- Modify: `tools/buildSoundSeekersPronunciationLexicon.mjs`
- Modify generated: `src/features/soundSeekers/content/pronunciationRecords.js`
- Modify generated: `src/features/soundSeekers/content/wordMeanings.js`
- Create: `tools/generateSoundSeekersSceneAudio.mjs`
- Create: `tools/checkSoundSeekersSceneAudio.mjs`
- Create: `public/audio/quest-v2/scenes/SOURCE.md`
- Create: `public/audio/quest-v2/scenes/scene-s1.mp3` through `scene-s40.mp3`
- Regenerate: `src/data/generated/audioFilePaths.generated.js`
- Regenerate: `src/data/generated/audioQuestPaths.generated.js`
- Create: `tests/unit/soundSeekersConnectedText.test.js`
- Create: `tests/unit/soundSeekersWordMeanings.test.js`
- Create: `tests/unit/soundSeekersCastArcs.test.js`
- Create: `tests/unit/soundSeekersSceneAudio.test.js`

`connectedTextRecords.js` is pure authored data for generator use. `connectedText.js` imports the records plus runtime pronunciation/word/schedule APIs and owns validation.

**Interfaces:**
- Consumes: Task 1 `CONNECTED_TEXT_IDS`, repair/relationship IDs, and `pronunciationCorpusInvariant.generated.js`; Task 2 introduction schedule and `stories` deck records; taught-target order; the canonical pronunciation corpus whose membership/count/hash are derived from the invariant; and the existing 32 identities.
- Produces: `CONNECTED_TEXT_RECORDS`, `SOUND_SEEKERS_CONNECTED_TEXT`, `getConnectedText(sceneId)`, `validateSceneAtStop(scene,stopId)`, `SOUND_SEEKERS_CAST`, generated meanings/pronunciation tags, 40 narration keys/files, and `assertSoundSeekersSceneAudio()`.
- Scene shape:

```js
{
  id: "scene-s1",
  stopId: "s1",
  level: "phrase",
  text: "A mat.",
  tokenIds: ["hw:a", "mat"],
  heartWordIds: ["hw:a"],
  narrationKey: "quest/scenes/scene-s1",
  choice: {
    kind: "assessed",
    promptDelivery: "audio",
    prompt: "What did the words name?",
    options: [
      { id: "mat", presentation: "image", accessibleLabel: "a mat", correct: true },
      { id: "sat", presentation: "image", accessibleLabel: "someone sat", correct: false }
    ],
    recordsDomain: "connected_text_transfer"
  },
  consequenceId: "meadow-mat-unrolls"
}
```

The `presentation: "image"` option does not claim its accessible/oral label is independently decodable. If an option is `presentation: "text"`, its visible label must pass the same stop-level readable-set validation as running text.

- [ ] **Step 1: Write failing reachability, readability, cast, generator, and audio tests**

```js
test("every expedition resolves exactly one first-visit scene", () => {
  assert.equal(SOUND_SEEKERS_CONNECTED_TEXT.length, 40);
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const scene = getConnectedText(expedition.connectedTextId);
    assert.equal(scene?.stopId, expedition.stopId);
    assert.deepEqual(validateSceneAtStop(scene, expedition.stopId), []);
  }
});

test("assessed and narrative choices keep evidence truth separate", () => {
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    if (scene.choice.kind === "assessed") {
      assert.equal(scene.choice.options.filter(option => option.correct).length, 1);
      assert.equal(scene.choice.recordsDomain, "connected_text_transfer");
    } else {
      assert.equal(scene.choice.kind, "narrative");
      assert.equal(scene.choice.recordsDomain, null);
      assert.equal(scene.choice.options.some(option => Object.hasOwn(option, "correct")), false);
    }
  }
});

test("visible text options are controlled at their stop", () => {
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    for (const option of scene.choice.options.filter(item => item.presentation === "text")) {
      assert.deepEqual(validateReadableText(option.label, scene.stopId), []);
    }
  }
});

test("cast arcs use the existing four identities and five relationship beats", () => {
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const arc = SOUND_SEEKERS_CAST[chapter.id];
    assert.equal(arc.characters.length, 4);
    assert.deepEqual(
      new Set(arc.characters.map(item => item.name)),
      new Set([chapter.cast.guide.name, ...chapter.cast.residents.map(item => item.name)])
    );
    assert.equal(arc.relationshipBeats.length, 5);
    assert.equal(arc.relationshipBeats.slice(1).every(beat => Boolean(beat.recallsRepairId)), true);
  }
});

test("every scene narration resolves to exact-text provenance", () => {
  const source = readSceneSourceManifest();
  assert.equal(source.assets.length, 40);
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const record = source.assets.find(item => item.sceneId === scene.id);
    assert.equal(record.text, scene.text);
    assert.equal(record.path, `/audio/quest-v2/scenes/${scene.id}.mp3`);
    assert.match(record.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(record.durationSeconds > 0);
    assert.equal(typeof record.humanListeningApproved, "boolean");
    if (record.humanListeningApproved) {
      assert.equal(record.humanListeningReview.sha256, record.sha256);
      assert.equal(Number.isNaN(Date.parse(record.humanListeningReview.reviewedAt)), false);
      assert.ok(record.humanListeningReview.reviewerRole);
      assert.ok(record.humanListeningReview.environment);
      assert.ok(record.humanListeningReview.evidenceRef);
    }
  }
});
```

- [ ] **Step 2: Run the content/audio tests and confirm the red state**

Run:

```bash
node --test tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersWordMeanings.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersSceneAudio.test.js
```

Expected: FAIL because the 40-scene, cast-arc, generated-source, and scene-audio catalogs do not exist.

- [ ] **Step 3: Author all 40 scenes and five relationship beats per chapter**

Write five scenes per chapter, growing from phrase to sentence to short passage. Reuse only IDs in `pronunciationCorpusInvariant.generated.js`; do not add a pronunciation record in this task. Before and after generation, compare the sorted record IDs and canonical content hash to that committed invariant and derive the displayed count as `recordIds.length`. This keeps corpus membership stable while still allowing the generator to update allowed `connected-text` tags and `taughtAt` provenance from the new catalogs.

Every scene:

- matches the expedition's exact `connectedTextId`, stop, repair, and consequence;
- uses only stop-supported word-bank tokens and already introduced high-frequency words;
- distinguishes an assessed text-supported decision from an unscored story choice;
- gives text-presented options the same readability check as running text;
- makes the semantic result visible without creating extra evidence;
- uses one of the existing 32 identities;
- has narration text exactly equal to the displayed controlled text.

Update `buildSoundSeekersPronunciationLexicon.mjs` to read the pure Task 2 and Task 3 source catalogs rather than legacy `stop.heartWords` and `stop.pages` for v2 tags/provenance. Extend generated meaning records with `ellSupport`, `answerLeak`, and `reviewedMeaningAction` from explicit generator source maps. Do not edit generated files by hand.

Run:

```bash
node tools/buildSoundSeekersPronunciationLexicon.mjs --write
node tools/buildSoundSeekersPronunciationLexicon.mjs
```

Expected: generated pronunciation/meaning files are current; sorted pronunciation IDs and the canonical content hash match the Task 1 invariant, and any reported count is derived from `recordIds.length` rather than a literal.

- [ ] **Step 4: Generate and provenance-lock 40 exact-text narrations**

Use `en-US-Chirp3-HD-Leda` and one scene per request. `tools/generateSoundSeekersSceneAudio.mjs` must:

- refuse text that differs from `scene.text`;
- write temporary sources outside `public/`;
- normalize/encode the accepted MP3;
- calculate duration, mean volume, and SHA-256;
- remove temporary files after acceptance;
- write one JSON-fenced `SOURCE.md` record with `sceneId`, exact text, voice, model, generation date, path, duration, signal checks, hash, `humanListeningApproved`, and optional `humanListeningReview`;
- never set human approval from automated checks.

Each record begins with `humanListeningApproved: false`. It may truthfully transition to `true` without regenerating audio only when `humanListeningReview` names the exact SHA, review date, reviewer role, listening environment, decision, and evidence reference. The checker rejects `true` without matching direct-review evidence; no named individual's sign-off becomes product authority.

Run:

```bash
node tools/generateSoundSeekersSceneAudio.mjs --all
node tools/checkSoundSeekersSceneAudio.mjs
node tools/generateAudioManifest.js
node --test tests/unit/soundSeekersSceneAudio.test.js
```

Expected: 40 final MP3s, no `*.tmp*` file under `public/audio/quest-v2/scenes`, exact manifest hashes/text, current general/quest audio manifests, and truthful direct-listening status. If direct listening is still open, report that gate as open.

- [ ] **Step 5: Run content, generator, audio, and legacy regressions**

Run:

```bash
node --test tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersWordMeanings.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersSceneAudio.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/soundSeekersPronunciationLexicon.test.js
node tools/buildSoundSeekersPronunciationLexicon.mjs
node tools/checkSoundSeekersSceneAudio.mjs
npm run check:quest
```

Expected: PASS. `check:quest` is still reported as legacy regression coverage until Task 6 integrates v2.

- [ ] **Step 6: Commit connected meaning, story transfer, and narration**

```bash
git add src/features/soundSeekers/content/connectedTextRecords.js src/features/soundSeekers/content/connectedText.js src/features/soundSeekers/content/castArcs.js src/features/soundSeekers/content/pronunciationRecords.js src/features/soundSeekers/content/wordMeanings.js tools/buildSoundSeekersPronunciationLexicon.mjs tools/generateSoundSeekersSceneAudio.mjs tools/checkSoundSeekersSceneAudio.mjs public/audio/quest-v2/scenes src/data/generated/audioFilePaths.generated.js src/data/generated/audioQuestPaths.generated.js tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersWordMeanings.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersSceneAudio.test.js
git commit -m "feat: author Sound Seekers connected stories"
```

### Task 4: Define eight semantic biome contracts and the code-native visual language

**Files:**
- Create: `src/features/soundSeekers/content/biomeKits.js`
- Create: `src/features/soundSeekers/visual/visualTokens.js`
- Create: `src/features/soundSeekers/visual/LayeredBiome.jsx`
- Create: `src/features/soundSeekers/visual/CharacterSystem.jsx`
- Create: `src/features/soundSeekers/visual/characterCustomization.js`
- Create: `src/features/soundSeekers/visual/CharacterCreator.jsx`
- Create: `src/features/soundSeekers/visual/Landmark.jsx`
- Create: `src/features/soundSeekers/visual/visual-system.css`
- Create: `tests/unit/soundSeekersBiomeKits.test.js`
- Create: `tests/unit/soundSeekersVisualSemantic.test.js`
- Create: `tests/unit/soundSeekersCharacterCreator.test.js`

Task 4 declares paths and semantic/crop contracts but does not read or require Task 5 files. Task 5 is the only raster producer. Do not run a missing-public-file build assertion here: Vite does not prove that a root-relative public URL exists.

**Interfaces:**
- Consumes: Task 1 chapter/repair IDs and Task 3's existing 32-character cast arcs.
- Produces: `SOUND_SEEKERS_VISUAL_TOKENS`, `SOUND_SEEKERS_BIOME_KITS`, `getBiomeKit(chapterId)`, `<LayeredBiome kit worldState profile />`, `createCharacterAppearance()`, `<SoundSeekersCharacter characterId pose appearance />`, `<SoundSeekersCharacterCreator value onChange />`, and `<Landmark landmark state />`.
- `characterCustomization.js` owns the allowlisted body shapes, palette token IDs, accessories, stable serialization, and `appearanceSignature()`. The creator preview and in-world avatar both render `<SoundSeekersCharacter>` with the same normalized appearance object; there is no preview-only character renderer.
- Biome shape:

```js
{
  id: "forge-settlement",
  background: {
    src: "/game-assets/sound-seekers/v2/biomes/forge-settlement/background.webp",
    provenanceId: "ssv2-forge-bg",
    expectedAspect: [16, 9],
    minSize: [1536, 864],
    focalPoints: {
      landscape: [0.5, 0.5],
      tablet: [0.5, 0.5],
      portrait: [0.58, 0.5]
    }
  },
  paletteTokenId: "forge-settlement",
  lighting: "upper-left-ember",
  semanticObjects: ["furnace", "anvil", "copper-machine", "rail"],
  layers: ["background-raster", "midground-machines", "foreground-route"],
  landmarks: forgeLandmarks,
  routeMaterial: "copper-rail",
  propFamily: "forged-machine-parts",
  rewardFamily: "copper-spark-badges",
  wonderEffect: "forge-rings-harmonize",
  taskCamera: { subjectZone: "lower-middle", quietZone: "center" },
  simplifiedScene: { decorativeDensity: 0.25, particles: 0 },
  reducedMotion: { transition: "outline-opacity-final-state" }
}
```

- [ ] **Step 1: Write failing semantic, cast, token, and profile tests**

```js
test("eight unique kits declare paths, crop contracts, and five repairs", () => {
  assert.equal(SOUND_SEEKERS_BIOME_KITS.length, 8);
  assert.equal(new Set(SOUND_SEEKERS_BIOME_KITS.map(kit => kit.background.src)).size, 8);
  for (const kit of SOUND_SEEKERS_BIOME_KITS) {
    assert.deepEqual(kit.background.expectedAspect, [16, 9]);
    assert.deepEqual(kit.background.minSize, [1536, 864]);
    assert.deepEqual(Object.keys(kit.background.focalPoints).sort(), ["landscape", "portrait", "tablet"]);
    assert.ok(kit.layers.length >= 3);
    assert.equal(kit.landmarks.length, 5);
    assert.ok(kit.landmarks.every(item => item.states.includes("dormant") && item.states.includes("repaired")));
    assert.ok(kit.simplifiedScene);
    assert.ok(kit.reducedMotion);
  }
});

test("semantic identity is structural and not color-only", () => {
  assert.ok(getBiomeKit("forge-settlement").semanticObjects.includes("furnace"));
  assert.ok(getBiomeKit("storm-coast").semanticObjects.includes("sea-cliff"));
  assert.ok(getBiomeKit("star-reach").semanticObjects.includes("observatory"));
  for (const kit of SOUND_SEEKERS_BIOME_KITS) {
    for (const landmark of kit.landmarks) {
      assert.ok(landmark.stateShape);
      assert.ok(landmark.accessibleStateLabel);
    }
  }
});

test("the v2 cast is exactly the existing thirty-two identities", () => {
  const characters = Object.values(SOUND_SEEKERS_CAST).flatMap(chapter => chapter.characters);
  assert.equal(characters.length, 32);
  assert.equal(new Set(characters.map(item => item.name)).size, 32);
  for (const character of characters) {
    assert.equal(character.styleId, "sound-seekers-painted-shape-v2");
    assert.deepEqual(character.requiredPoses, ["idle", "explain", "encourage", "celebrate", "repair"]);
  }
});

test("creator preview and world avatar use one normalized CharacterSystem appearance", () => {
  const appearance = createCharacterAppearance({
    bodyShapeId: "round-scout",
    paletteTokenId: "river-gardens",
    accessoryIds: ["trail-satchel", "leaf-pin"]
  });
  const preview = renderToStaticMarkup(React.createElement(SoundSeekersCharacter, {
    characterId: "player", pose: "idle", appearance, context: "preview"
  }));
  const world = renderToStaticMarkup(React.createElement(SoundSeekersCharacter, {
    characterId: "player", pose: "idle", appearance, context: "world"
  }));
  const signature = appearanceSignature(appearance);
  assert.match(preview, new RegExp(`data-appearance-signature="${signature}"`));
  assert.match(world, new RegExp(`data-appearance-signature="${signature}"`));
  assert.equal(
    preview.replace('data-context="preview"', 'data-context="shared"'),
    world.replace('data-context="world"', 'data-context="shared"')
  );
});
```

- [ ] **Step 2: Run visual-contract tests and confirm the red state**

Run:

```bash
node --test tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersVisualSemantic.test.js tests/unit/soundSeekersCharacterCreator.test.js
```

Expected: FAIL because biome contracts and unified visual components do not exist.

- [ ] **Step 3: Implement tokens, manifests, layered shapes, characters, and landmarks**

Define all raw colors once in `visualTokens.js`. Export token names and inject matching CSS custom properties. `biomeKits.js` stores `paletteTokenId` only.

Implement:

- quiet raster background with focal point selected by profile;
- code-native midground/foreground shapes and semantic landmarks;
- highest local contrast on current interactables;
- dormant/repaired state changes carried by silhouette, part count, pattern, and accessible state label as well as color;
- the same shared proportions, face placement, outline, body slots, palette slots, and pose names for avatar and all 32 residents;
- SS-19 creator controls for every allowlisted body shape, palette, and accessory; selection updates one normalized appearance and previews it through `<SoundSeekersCharacter>`;
- stable appearance serialization that can be persisted as a cosmetic setting without changing challenge selection, evidence, difficulty, or rewards;
- simplified density without removing required learning objects;
- reduced-motion opacity/outline/final-state replacements;
- code-native focus, grapheme plates, captions, masks, particles, and text.

- [ ] **Step 4: Run component/static-render tests**

Run:

```bash
node --test tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersVisualSemantic.test.js tests/unit/soundSeekersCharacterCreator.test.js tests/unit/soundSeekersCastArcs.test.js
```

Expected: PASS with eight unique declared asset paths, 40 landmark state pairs, one 32-character vocabulary, color-independent state semantics, creator/world appearance parity, and no requirement that Task 5 files already exist.

- [ ] **Step 5: Commit the visual contracts**

```bash
git add src/features/soundSeekers/content/biomeKits.js src/features/soundSeekers/visual tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersVisualSemantic.test.js tests/unit/soundSeekersCharacterCreator.test.js
git commit -m "feat: define eight Sound Seekers biome kits"
```

### Task 5: Generate, crop-review, optimize, and provenance-lock eight biome backgrounds

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

Do not modify or stage `biomeKits.js` in this task. Its declared paths, prompts, semantic objects, focal points, and crop contracts are Task 5 inputs.

**Interfaces:**
- Consumes: Task 4 biome records and the image-generation skill.
- Produces: eight unique exact-16:9 WebPs of at least 1536×864, a JSON-fenced SOURCE manifest, crop-review sheets under `.artifacts/sound-seekers-v2/crop-review/`, `readSoundSeekersV2AssetManifest()`, `assertSoundSeekersV2Assets()`, and `npm run check:sound-seekers-assets`.
- SOURCE asset schema: one JSON fence contains `{ schemaVersion: 1, project: "LiteracyPath Sound Seekers v2", assets: [...] }`. Each asset record must carry `id`, public `path`, `tool`, exact returned `model`, ISO `generatedAt`, the complete generation `prompt`, `original.{width,height,sha256}`, `transform.{method,left,top,width,height,encoder,quality}`, `final.{width,height,sha256}`, `containsText`, `agentOriginalResolutionReviewed`, `cropProfilesRendered`, `humanCropReviewed`, `humanSemanticReviewed`, optional `humanReview`, and `reviewNote`. The parser rejects missing or extra assets, malformed hashes or dates, multiple JSON fences, prose-derived defaults, and final paths outside `/game-assets/sound-seekers/v2/`. Human booleans begin `false`; either may transition independently to `true` only when `humanReview` records the exact final SHA, review date, reviewer role, relevant crop profiles/semantic object IDs, decision, environment, and evidence references. A later direct review updates only those provenance fields, not the generated image.

- [ ] **Step 1: Write the failing parser, raster, hash, ratio, and crop-contract test**

```js
test("every declared biome background is exact, unique, and provenance locked", async () => {
  const manifest = readSoundSeekersV2AssetManifest();
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.assets.length, 8);
  assert.equal(new Set(manifest.assets.map(asset => asset.final.sha256)).size, 8);

  for (const kit of SOUND_SEEKERS_BIOME_KITS) {
    const asset = manifest.assets.find(item => item.id === kit.background.provenanceId);
    assert.equal(asset.path, kit.background.src);
    const meta = await sharp(publicPath(asset.path)).metadata();
    assert.ok(meta.width >= 1536 && meta.height >= 864);
    assert.equal(meta.width * 9, meta.height * 16);
    assert.equal(asset.final.width, meta.width);
    assert.equal(asset.final.height, meta.height);
    assert.equal(asset.final.sha256, sha256(publicPath(asset.path)));
    assert.equal(asset.tool, "OpenAI image generation");
    assert.ok(asset.model.trim());
    assert.equal(Number.isNaN(Date.parse(asset.generatedAt)), false);
    assert.ok(asset.prompt.includes("wide clear lower-middle gameplay lane"));
    assert.match(asset.original.sha256, /^[a-f0-9]{64}$/u);
    assert.equal(asset.transform.method, "crop-not-stretch");
    assert.ok(asset.transform.left >= 0 && asset.transform.top >= 0);
    assert.ok(asset.transform.left + asset.transform.width <= asset.original.width);
    assert.ok(asset.transform.top + asset.transform.height <= asset.original.height);
    assert.equal(asset.transform.width, asset.final.width);
    assert.equal(asset.transform.height, asset.final.height);
    assert.deepEqual(asset.cropProfilesRendered.sort(), ["landscape", "portrait", "tablet"]);
    assert.equal(asset.containsText, false);
    assert.equal(asset.agentOriginalResolutionReviewed, true);
    assert.equal(typeof asset.humanCropReviewed, "boolean");
    assert.equal(typeof asset.humanSemanticReviewed, "boolean");
    if (asset.humanCropReviewed || asset.humanSemanticReviewed) {
      assert.equal(asset.humanReview.sha256, asset.final.sha256);
      assert.equal(Number.isNaN(Date.parse(asset.humanReview.reviewedAt)), false);
      assert.ok(asset.humanReview.reviewerRole);
      assert.ok(asset.humanReview.environment);
      assert.ok(asset.humanReview.evidenceRefs.length > 0);
    }
    if (asset.humanCropReviewed) assert.deepEqual(asset.humanReview.cropProfiles.sort(), ["landscape", "portrait", "tablet"]);
    if (asset.humanSemanticReviewed) assert.deepEqual(new Set(asset.humanReview.semanticObjectIds), new Set(kit.semanticObjects));
  }
});
```

- [ ] **Step 2: Run the asset test and confirm the red state**

Run:

```bash
node --test tests/unit/soundSeekersAssetManifest.test.js
```

Expected: FAIL because the v2 asset root, parser, manifest, and raster files do not exist.

- [ ] **Step 3: Generate one coherent background per biome**

Read `/Users/benjaminbowler/.codex/skills/.system/imagegen/SKILL.md` completely before generation. Make eight separate built-in image-generation calls, one per biome. Never batch several distinct backgrounds into one call.

Use this shared direction in every call:

```text
Wide 16:9 environmental background for a premium early-literacy 2D adventure game, original hand-painted shape-led storybook style, rounded readable silhouettes, restrained paper-and-gouache texture, consistent upper-left lighting, quiet depth, child-safe, coherent warm material rendering, wide clear lower-middle gameplay lane, subdued contrast behind play space, no characters, no interface, no letters, no words, no logo, no watermark, no border. The image is background depth only; interactive objects will be drawn in code.
```

Append exactly one biome block:

- Seedwake Meadow: dawn pasture, waking seed lanterns, living hedges, warm wood, pale gold and fresh green.
- River Gardens: water channels, garden terraces, sluices, reeds, ceramic markers, turquoise and terracotta.
- Fossil Canyon: layered sandstone shelves, ancient tracks, bone arches, amber afternoon light.
- Forge Settlement: working furnaces, dark stone, copper and iron machines, rails, controlled ember glow.
- Glass Marsh: reflective jade pools, glass reeds, mist, refracted safe paths, cool green light.
- Storm Coast: sea cliffs, spray, wind instruments, timber shelters, storm clearing toward warm light.
- Lantern Forest: deep layered woods, root bridges, hanging lantern paths, moss and muted gold.
- Star Reach: high observatory terraces, comet stairs, readable celestial mechanisms, indigo and warm starlight.

For each generated candidate:

1. Inspect the untouched original at original resolution.
2. Reject text/glyphs, watermarks, central clutter, unsafe imagery, semantic mismatch, inconsistent lighting/style, or a blocked gameplay lane.
3. Make at most one targeted revision for a specific defect.
4. Copy the accepted source into a temporary directory outside `public/`.
5. Use `prepareSoundSeekersV2Background.mjs` to crop without stretching, encode WebP, hash original/final, and write the manifest record.
6. Remove rejected variants and temporary conversion files after the accepted final is verified.

- [ ] **Step 4: Render responsive crops and inspect them directly**

Run:

```bash
node tools/buildSoundSeekersV2CropReview.mjs
node tools/checkSoundSeekersV2Assets.mjs
```

Expected: the crop tool produces landscape, tablet, and portrait sheets for all eight kits using Task 4 focal points. Inspect every sheet directly. Record agent review notes truthfully. Keep each human flag `false` until its corresponding direct review occurs; if that review happens during implementation, set only the reviewed flag and add the exact `humanReview` evidence required by the schema.

Agent inspection may set `agentOriginalResolutionReviewed` after viewing the untouched image at original detail, but it never sets either human flag. `humanSemanticReviewed` becomes true only after a direct person review confirms that the biome and all required semantic objects are recognizable without labels and the matching review provenance is recorded; structural IDs and automated screenshot visibility are not that confirmation.

- [ ] **Step 5: Run asset and public-media policy checks**

Add:

```json
"check:sound-seekers-assets": "node tools/checkSoundSeekersV2Assets.mjs"
```

Run:

```bash
npm run check:sound-seekers-assets
node --test tests/unit/soundSeekersAssetManifest.test.js tests/unit/soundSeekersBiomeKits.test.js
npm run check:public-media-policy
```

Expected: PASS with exactly eight declared/unique WebPs, exact ratios and hashes, no undeclared raster under the v2 root, no forbidden public media, and no claim of unperformed human review.

- [ ] **Step 6: Commit the inspected candidate art**

```bash
git add public/game-assets/sound-seekers/v2 tools/lib/soundSeekersV2AssetManifest.mjs tools/prepareSoundSeekersV2Background.mjs tools/buildSoundSeekersV2CropReview.mjs tools/checkSoundSeekersV2Assets.mjs tests/unit/soundSeekersAssetManifest.test.js package.json
git commit -m "feat: add eight Sound Seekers biome backgrounds"
```

### Task 6: Integrate static truth gates, offline media, and a content/art review gallery

**Files:**
- Create: `tools/checkSoundSeekersV2Content.mjs`
- Create: `tools/checkSoundSeekersVisualSemantic.mjs`
- Extend: `tools/checkQuestIntegrity.js`
- Modify: `tools/viteQuestOfflinePlugin.mjs`
- Modify: `tools/checkQuestOffline.mjs`
- Create: `preview/sound-seekers-v2-content.html`
- Create: `preview/sound-seekers-v2-content.jsx`
- Create: `src/features/soundSeekers/preview/ContentArtGallery.jsx`
- Create: `src/features/soundSeekers/preview/content-art-gallery.css`
- Create: `tools/shootSoundSeekersV2Content.mjs`
- Create: `tests/browser/sound-seekers-visual-semantic.spec.js`
- Create: `tests/browser/sound-seekers-content-gallery.spec.js`
- Modify: `tests/quest-offline/quest-offline.spec.js`
- Modify: `package.json`

Do not use or create `/quest-preview.html`. Do not modify the production child route. This task's page is a deterministic dev-only gallery that renders canonical records/components for review; actual first-visit gameplay reachability belongs to the later runtime plan.

**Interfaces:**
- Consumes: all Task 1–5 catalogs, narration and instruction audio, accepted asset manifest/files, and visual components.
- Produces: `assertSoundSeekersV2Content()`, `assertSoundSeekersVisualSemantics()`, `check:sound-seekers-content`, aggregate `check:sound-seekers-art`, offline warming support for v2 media, and screenshot coverage for eight maps, 40 expedition/scene/repair fixtures, eight Wonders, eight bosses, full/simplified/reduced-motion, 320px portrait/landscape, and 200% zoom.
- Also produces an SS-19 creator gallery fixture for every allowlisted body shape, palette, and accessory plus a preview/world pair using the same serialized appearance signature.
- Gallery URL:

```text
/preview/sound-seekers-v2-content.html?chapter=forge-settlement&stop=s20&state=repair&profile=full&labels=hidden&seed=11
/preview/sound-seekers-v2-content.html?mode=creator&body=round-scout&palette=river-gardens&accessories=trail-satchel,leaf-pin
```

- [ ] **Step 1: Write failing static integration, gallery, and offline assertions**

```js
test("all chapters render declared semantic structures without visible labels", async ({ page }) => {
  for (const [chapterId, semanticObject] of [
    ["forge-settlement", "furnace"],
    ["storm-coast", "sea-cliff"],
    ["star-reach", "observatory"]
  ]) {
    await page.goto(`/preview/sound-seekers-v2-content.html?chapter=${chapterId}&labels=hidden&seed=11`);
    await expect(page.getByTestId("biome-scene")).toHaveAttribute(
      "data-semantic-object",
      new RegExp(semanticObject)
    );
    await expect(page.getByTestId(`semantic-${semanticObject}`)).toBeVisible();
  }
});

for (let stop = 1; stop <= 40; stop += 1) {
  test(`gallery renders authored scene and repair fixture for s${stop}`, async ({ page }) => {
    await page.goto(`/preview/sound-seekers-v2-content.html?stop=s${stop}&state=transfer&seed=11`);
    await expect(page.getByTestId("connected-text")).toBeVisible();
    await expect(page.getByTestId("repair-preview")).toHaveAttribute("data-stop", `s${stop}`);
  });
}

test("creator selection is visually identical in preview and world", async ({ page }) => {
  await page.goto("/preview/sound-seekers-v2-content.html?mode=creator&body=round-scout&palette=river-gardens&accessories=trail-satchel,leaf-pin");
  const preview = page.getByTestId("creator-character-preview");
  const world = page.getByTestId("creator-character-world");
  await expect(preview).toHaveAttribute("data-appearance-signature", await world.getAttribute("data-appearance-signature"));
  await expect(page.getByTestId("creator-option-round-scout")).toHaveAttribute("aria-pressed", "true");
});
```

Static integration assertions must fail on:

- any stop/order/target drift from 40/103 or non-review teaching at `s8`/`s17`;
- a review stop without the canonical review source, a review candidate not taught strictly before that stop, nondeterministic replay/resume, or a non-review stop that resolves review targets;
- unresolved chapter, power, instruction, heart slot, scene, repair, relationship, consequence, pronunciation, meaning, narration, or asset foreign key;
- a first-use tutorial that records evidence;
- an untaught scored target or boss unit;
- an invalid distractor or readable option beyond the stop-level readable set;
- a high-frequency word used before introduction or missing from all real slots;
- overlapping/incomplete regular/heart unit partitions;
- activity subtype loss or GPC fan-out;
- starvation in seeded first journeys, a missing/duplicate structural slot, any of the five catalog categories without its authored producer/runtime-consumer contract, missing morphology/transfer persisted categories, a resume mismatch, or incomplete derived cycle coverage including any of the four high-frequency-word activity types;
- a scene with ambiguous correctness or narrative correctness metadata;
- an internal ID in child text;
- a fifth invented resident, missing relationship beat, Wonder, boss, repair, or landmark;
- any creator option absent from the gallery, an invalid persisted appearance, a preview-only renderer, or a preview/world appearance-signature mismatch;
- a raw color outside `visualTokens.js`;
- duplicate/missing/incorrect-ratio art, absent provenance, or undeclared v2 raster;
- narration text/hash/path mismatch or incomplete instruction contract.

- [ ] **Step 2: Run the new gates and confirm the red state**

Run:

```bash
node tools/checkSoundSeekersV2Content.mjs
node tools/checkSoundSeekersVisualSemantic.mjs
npx playwright test tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-gallery.spec.js --config=playwright.quest.config.js
```

Expected: FAIL until the aggregate validators, gallery, and semantic fixtures exist.

- [ ] **Step 3: Implement the pure validators and integrate the legacy aggregate**

Export assertion functions from the two new tools; keep CLI exit handling in a guarded main block so tests and `checkQuestIntegrity.js` can import them without side effects.

Extend `checkQuestIntegrity.js` to:

- call the v2 content assertion;
- include `src/features/soundSeekers/content`, `engine`, and `visual` in source-policy scanning;
- allow raw color literals only in `src/features/soundSeekers/visual/visualTokens.js` in the v2 tree;
- retain every legacy check until cutover.

Add scripts:

```json
"check:sound-seekers-content": "node tools/checkSoundSeekersV2Content.mjs",
"check:sound-seekers-art": "npm run check:sound-seekers-assets && node tools/checkSoundSeekersVisualSemantic.mjs",
"shots:sound-seekers-content": "node tools/shootSoundSeekersV2Content.mjs"
```

Task 5 remains the sole owner of `check:sound-seekers-assets`.

- [ ] **Step 4: Add truthful offline media caching**

Add these exact media prefixes to `QUEST_MEDIA_PREFIXES`:

```js
"/game-assets/sound-seekers/v2/",
"/audio/quest-v2/"
```

Do not precache every large media file into the shell. Keep cache-on-request and explicit chapter warming behavior. Extend offline unit/browser fixtures to warm one v2 background, one instruction file, and one scene narration; verify complete 200 responses are available offline and range requests retain the existing safe behavior.

Run:

```bash
npm run build:quest-offline-test
npm run check:quest-offline
npm run test:quest-offline -- --grep "Sound Seekers v2 media"
```

Expected: PASS with v2 media cacheable through the existing quest media cache. This is browser/offline harness evidence, not physical-iPad proof.

- [ ] **Step 5: Implement deterministic content/art gallery and screenshot matrix**

The gallery reads canonical catalogs and renders the same Task 4 components. It may select a stop, phase fixture, world state, profile, seed, and label visibility, but it must not synthesize literacy evidence or claim the mission reducer made the state reachable.

Creator mode renders one interactive `<SoundSeekersCharacterCreator>` plus a neighboring in-world `<SoundSeekersCharacter>` driven by the same normalized appearance. The matrix changes every body shape, palette, and accessory, checks visible selection/focus state, and compares the semantic appearance signature and screenshots. Customization remains cosmetic and cannot mutate curriculum, challenge, evidence, support, or reward fixtures.

`shootSoundSeekersV2Content.mjs` captures:

- eight chapter map/full scenes;
- one transfer/repair fixture per stop;
- eight Wonders and eight bosses;
- every SS-19 body shape, palette, and accessory, with creator-preview/in-world parity;
- full, simplified, and reduced-motion profiles;
- 320×568 portrait, 568×320 landscape, tablet, and desktop;
- browser zoom at 200%;
- console errors, failed media requests, visible controls, and semantic IDs beside each PNG.

Write the complete run to `.artifacts/sound-seekers-v2/content-gallery/<run-id>/` with a machine-readable manifest beside the PNGs. Confirm `.artifacts/` is ignored before running, and never copy the generated run into `docs/` or add it to a commit.

Use fixed seeds and disable nonessential motion. Split browser coverage into one Playwright test per stop/profile rather than one 40-navigation test that can exceed the 45-second test timeout.

- [ ] **Step 6: Run static, generated, unit, rendered, offline, and build verification**

Run:

```bash
npm run check:sound-seekers-content
npm run check:sound-seekers-art
node tools/buildSoundSeekersPronunciationLexicon.mjs
node tools/checkSoundSeekersSceneAudio.mjs
node --test tests/unit/soundSeekersExpeditions.test.js tests/unit/soundSeekersReviewSequences.test.js tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentDecks.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersWordMeanings.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersSceneAudio.test.js tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersVisualSemantic.test.js tests/unit/soundSeekersCharacterCreator.test.js tests/unit/soundSeekersAssetManifest.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js
npx playwright test tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-gallery.spec.js --config=playwright.quest.config.js
npm run check:quest
npm run build
npm run shots:sound-seekers-content
```

Expected: automated gates pass with pristine generated outputs. Inspect the screenshot/crop sheets directly and record what was actually reviewed. Do not translate passing automation into human crop approval, semantic recognizability, narration listening approval, physical-device behavior, child comprehension, hosted persistence, deployment, or production readiness.

- [ ] **Step 7: Commit the integrated content/art gates**

```bash
git add tools/checkSoundSeekersV2Content.mjs tools/checkSoundSeekersVisualSemantic.mjs tools/checkQuestIntegrity.js tools/viteQuestOfflinePlugin.mjs tools/checkQuestOffline.mjs preview/sound-seekers-v2-content.html preview/sound-seekers-v2-content.jsx src/features/soundSeekers/preview tools/shootSoundSeekersV2Content.mjs tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-gallery.spec.js tests/quest-offline/quest-offline.spec.js package.json
git commit -m "test: gate Sound Seekers content and art"
```

## Completion boundary

This plan is complete only when Tasks 1–6 and their stated automated gates pass and all generated sources are current. The following remain independent direct gates and must be reported separately: human listening of instruction and 40 scene recordings; human crop and semantic review; formative child testing; physical-iPad Safari behavior; authenticated hosted persistence; deployment; and production operation.

The next implementation plan is `docs/superpowers/plans/2026-09-01-sound-seekers-v2-game-runtime.md`. It consumes this plan's validated outputs and is the first place that may claim production-route reachability or six-power gameplay behavior.
