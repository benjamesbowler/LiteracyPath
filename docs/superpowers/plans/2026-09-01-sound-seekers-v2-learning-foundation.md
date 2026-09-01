# Sound Seekers v2 Learning Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Sound Seekers' legacy save, pronunciation, evidence, mastery, review, correction, instruction, and audio logic with a truthful v2 practice-learning foundation.

**Architecture:** Keep `phonics_quest/__all__`, teacher assignment ownership, app accessibility preferences, privacy exclusions, and the existing storage/sync boundary. Introduce a version-2 game-owned state that rejects v1 learning history, a shipping lexicon containing explicit sound units for every live word, immutable per-decision practice evidence, a monotonic journey clock, and exact instruction/audio contracts. Pure modules remain independent of React and Supabase so their behavior is covered by Node tests; the SQL migration mirrors the same merge rules.

**Tech Stack:** JavaScript ES modules, Node `node:test`, React/Vite storage integration, Supabase PostgreSQL migration SQL.

**Spec:** `docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md`

## Global Constraints

- Sound Seekers state is `v: 2`; v1 gameplay, mastery, rewards, checkpoints, and attempt history do not migrate or dual-write.
- Preserve only valid teacher assignments and app-owned accessibility/audio preferences at the cutover; do not delete hosted rows.
- Evidence uses `evidenceKind: "practice"`; practice may recommend teaching but cannot set formal assessment or `SECURE` status.
- Learning domains are exactly `phoneme_to_grapheme`, `grapheme_to_phoneme`, `word_decoding`, `word_segmentation_encoding`, `connected_text_transfer`, `heart_word_mapping`, and `novel_decoding`.
- One explicit literacy action emits at most one immutable evidence event; movement, collision, collection, animation, timing, and reward actions emit none.
- Required audio counts only after delivery status `completed`; unavailable, loading, started, interrupted, failed, or muted delivery cannot become independent audio-dependent evidence.
- `questMastery.js` is the sole numeric practice-readiness authority.
- Review spacing uses monotonic `journeyStep`, never the wrapped 1-40 route cursor.
- No scored target may appear before its complete teach event in a fresh journey.
- Every shipping word has one explicit pronunciation record; runtime spelling-derived segmentation is forbidden.

## Execution Set and Requirement Coverage

Execute the four plans in this order: learning foundation; content and art; game runtime; cutover and release.

| Requirement | Owning plan/task |
| --- | --- |
| SS-01 world repair | content/art Task 1; runtime Task 3 |
| SS-02 six systems | runtime Task 1 |
| SS-03 workbench | runtime Task 2 |
| SS-04 independent blend/segment | runtime Tasks 1-2 |
| SS-05 expeditions/Wonders | content/art Task 1; runtime Task 3 |
| SS-06 replay/motor assistance | runtime Tasks 1 and 6 |
| SS-07 pronunciation lexicon | foundation Task 2 |
| SS-08 teach every target | foundation Task 5; runtime Tasks 3 and 5 |
| SS-09 per-action evidence | foundation Tasks 1 and 3 |
| SS-10 real domains/mastery authority | foundation Task 3; cutover Task 1 |
| SS-11 adaptive director | foundation Task 4 |
| SS-12 correction ladder | foundation Task 4 |
| SS-13 instruction/audio truth | foundation Task 5; runtime Task 6 |
| SS-14 heart words | content/art Task 2 |
| SS-15 connected text | content/art Task 3 |
| SS-16 meaning/residents | content/art Task 3; runtime Task 3 |
| SS-17 monotonic review/coverage | foundation Task 4; content/art Task 2 |
| SS-18 eight biome kits | content/art Tasks 4-6 |
| SS-19 cast/HUD/game feel | content/art Task 4; runtime Tasks 4-5 |
| SS-20 product-truth release | runtime Task 6; cutover Tasks 2-5 |

---

### Task 1: Establish the clean v2 state, normalizer, client merge, and hosted merge

**Files:**
- Create: `src/features/soundSeekers/engine/stateV2.js`
- Modify: `src/utils/questStore.js`
- Modify: `src/utils/progressMerge.js`
- Modify: `src/utils/questStorageRecovery.js`
- Create: `supabase/migrations/20260901120000_sound_seekers_learning_v2.sql`
- Create: `tests/unit/soundSeekersStateV2.test.js`
- Modify: `tests/unit/progressMerge.test.js`
- Create: `tests/sql/sound_seekers_learning_v2_merge.sql`

**Interfaces:**
- Consumes: `questProgressStorageKey(scopeKey)`, `queueProgressSave("phonics_quest", "__all__", payload, { scopeKey })`, and the existing teacher-owned assignment stripping rule.
- Produces: `SOUND_SEEKERS_SCHEMA_VERSION`, `SOUND_SEEKERS_CONTENT_VERSION`, `createSoundSeekersState(seed?)`, `normalizeSoundSeekersState(raw, carry?)`, `mergeSoundSeekersStates(local, remote)`, and `isSoundSeekersV2(raw)`.

- [ ] **Step 1: Write the failing v2 cutover tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createSoundSeekersState,
  mergeSoundSeekersStates,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";

test("v1 learning starts a fresh v2 game while allowlisted preferences survive", () => {
  const next = normalizeSoundSeekersState({
    v: 1,
    mastery: { sh: { correct: 99 } },
    checkpoint: { stopId: "s39" },
    settings: { reducedMotion: true, music: false },
    assignment: { stopIds: ["s4"] }
  });
  assert.equal(next.v, 2);
  assert.deepEqual(next.evidence, []);
  assert.equal(next.checkpoint, null);
  assert.equal(next.trail.journeyStep, 1);
  assert.deepEqual(next.assignment, { stopIds: ["s4"] });
  assert.equal(next.settings.reducedMotion, true);
});

test("v2 merge unions immutable events, monotonic repairs, and reset ancestry", () => {
  const base = createSoundSeekersState();
  const a = { ...base, evidence: [{ id: "a", at: 1 }], trail: { ...base.trail, journeyStep: 41, repairs: { mill: true } } };
  const b = { ...base, evidence: [{ id: "b", at: 2 }], trail: { ...base.trail, journeyStep: 42, repairs: { bridge: true } } };
  const merged = mergeSoundSeekersStates(a, b);
  assert.deepEqual(merged.evidence.map(event => event.id), ["a", "b"]);
  assert.equal(merged.trail.journeyStep, 42);
  assert.deepEqual(merged.trail.repairs, { mill: true, bridge: true });
});
```

- [ ] **Step 2: Run the focused tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js`

Expected: FAIL because `stateV2.js` and the v2 merge branch do not exist.

- [ ] **Step 3: Implement the state contract and deterministic merge**

```js
export const SOUND_SEEKERS_SCHEMA_VERSION = 2;
export const SOUND_SEEKERS_CONTENT_VERSION = "sound-seekers-v2";
export const MAX_SOUND_SEEKERS_EVIDENCE = 1200;

export function createSoundSeekersState(seed = {}) {
  return {
    v: 2,
    contentVersion: SOUND_SEEKERS_CONTENT_VERSION,
    reset: { epoch: Number(seed.reset?.epoch) || 0, at: seed.reset?.at || null },
    trail: { routeCursor: 1, journeyStep: 1, completedStopIds: [], repairs: {}, chapterCoverage: {} },
    evidence: [],
    confusions: {},
    contentDecks: { heartWords: {}, stories: {}, alternatives: {} },
    journal: { words: [], scenes: [], stickers: [] },
    rewards: { claimedIds: [] },
    checkpoint: null,
    assignment: seed.assignment || null,
    settings: normalizeAllowlistedSettings(seed.settings)
  };
}
```

Implement these exact merge rules: higher reset epoch wins; only v2 game-owned fields merge; events deduplicate by `id`, sort by `at` then `id`, and retain the newest 1,200; `journeyStep` takes the maximum; completed stops, repair keys, journal IDs, and reward IDs union; `chapterCoverage` takes per-key maxima; a checkpoint is retained only from the locally owned valid writer and only when `contentVersion` matches; teacher assignment overlays without being uploaded from a child. Update storage recovery validation to recognize the v2 minimum shape.

Create SQL helpers `lp_quest_union_v2_evidence(jsonb,jsonb)` and `lp_quest_merge_learning_v2(jsonb,jsonb)` and route the `phonics_quest` branch through them. Grant execution only to the repository's existing `anon` and `authenticated` roles. Make v2 win over stale v1 while preserving an existing teacher assignment when the incoming child payload omits it.

- [ ] **Step 4: Run client and SQL contract checks**

Run: `node --test tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js tests/unit/questStorageRecovery.test.js`

Expected: PASS with no warnings.

Run: `node tools/checkDatabaseBootstrapSchema.mjs`

Expected: PASS with the new migration discoverable and no bootstrap-schema drift.

- [ ] **Step 5: Commit the v2 state boundary**

```bash
git add src/features/soundSeekers/engine/stateV2.js src/utils/questStore.js src/utils/progressMerge.js src/utils/questStorageRecovery.js supabase/migrations/20260901120000_sound_seekers_learning_v2.sql tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js tests/sql/sound_seekers_learning_v2_merge.sql
git commit -m "feat: establish Sound Seekers v2 state"
```

### Task 2: Build the explicit pronunciation lexicon and shipping validator

**Files:**
- Create: `src/features/soundSeekers/content/pronunciationLexicon.js`
- Create: `src/features/soundSeekers/content/pronunciationRecords.js`
- Create: `src/features/soundSeekers/content/wordMeanings.js`
- Create: `tools/buildSoundSeekersPronunciationLexicon.mjs`
- Modify: `tools/checkQuestIntegrity.js`
- Create: `tests/unit/soundSeekersPronunciationLexicon.test.js`

**Interfaces:**
- Consumes: all unique words reachable from `src/data/questSequence.js`, all 60 heart words, connected-text tokens added by the content plan, and approved keys from `src/data/phonemeAudioBank.js`.
- Produces: `SOUND_SEEKERS_WORDS`, `getPronunciation(wordId)`, `getWordMeaning(meaningId)`, `assertShippingPronunciationLexicon(content)`, and records whose `units` contain `{ grapheme, soundKey, letterIndices, role }`.

- [ ] **Step 1: Write failing corpus and pronunciation-edge tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  getPronunciation,
  SOUND_SEEKERS_WORDS,
  assertShippingPronunciationLexicon
} from "../../src/features/soundSeekers/content/pronunciationLexicon.js";

test("word-workbench fixtures have explicit sound boxes", () => {
  assert.deepEqual(getPronunciation("ship").units.map(unit => unit.grapheme), ["sh", "i", "p"]);
  assert.deepEqual(getPronunciation("moon").units.map(unit => unit.grapheme), ["m", "oo", "n"]);
  assert.deepEqual(getPronunciation("cake").units.map(unit => unit.grapheme), ["c", "a_e", "k"]);
  assert.deepEqual(getPronunciation("pop").units.map(unit => unit.grapheme), ["p", "o", "p"]);
});

test("shipping records represent contextual pronunciations explicitly", () => {
  for (const fixture of ["thin", "this", "new", "grew", "cats", "dogs", "wanted", "jumped", "city", "giant"]) {
    assert.ok(getPronunciation(fixture), fixture);
  }
  assert.doesNotThrow(() => assertShippingPronunciationLexicon(SOUND_SEEKERS_WORDS));
});
```

- [ ] **Step 2: Run the lexicon test and confirm the red state**

Run: `node --test tests/unit/soundSeekersPronunciationLexicon.test.js`

Expected: FAIL because the canonical records and validator do not exist.

- [ ] **Step 3: Author explicit records and a build-time-only compiler**

```js
export const PRONUNCIATION_RECORDS = Object.freeze({
  ship: {
    word: "ship",
    pronunciation: "ship",
    meaningId: "ship-vessel",
    units: [
      { grapheme: "sh", soundKey: "sh", letterIndices: [0, 1], role: "regular" },
      { grapheme: "i", soundKey: "short_i", letterIndices: [2], role: "regular" },
      { grapheme: "p", soundKey: "p", letterIndices: [3], role: "regular" }
    ],
    tags: ["decodable"]
  }
});
```

The authoring tool may read current curriculum sources and emit a deterministic candidate file, but the committed shipping module must contain explicit units and must never call a segmenter at runtime. Encode separate voiced/unvoiced `th`, `/ju:/` and `/u:/` `ew`, plural `-s`, past `-ed`, soft `c/g`, split digraphs, multi-letter graphemes, and approved schwa/context records. Give every Word Forge and Blend Bridge word a meaning record with a child-safe sense, action cue, part of speech, age band, and image/action reference. The validator must reject missing units, overlapping/uncovered letter indices, unknown audio keys, missing meanings, duplicate word IDs, or generated fallback flags.

- [ ] **Step 4: Run the corpus gate and existing audio tests**

Run: `node --test tests/unit/soundSeekersPronunciationLexicon.test.js tests/unit/phonemeAudioBank.test.js`

Expected: PASS; every reachable shipping word resolves exactly once.

Run: `npm run check:quest`

Expected: PASS with the lexicon validator included.

- [ ] **Step 5: Commit the canonical pronunciation content**

```bash
git add src/features/soundSeekers/content/pronunciationLexicon.js src/features/soundSeekers/content/pronunciationRecords.js src/features/soundSeekers/content/wordMeanings.js tools/buildSoundSeekersPronunciationLexicon.mjs tools/checkQuestIntegrity.js tests/unit/soundSeekersPronunciationLexicon.test.js
git commit -m "feat: author Sound Seekers pronunciation lexicon"
```

### Task 3: Record one truthful event per literacy decision and derive practice readiness

**Files:**
- Create: `src/features/soundSeekers/engine/evidence.js`
- Create: `src/features/soundSeekers/engine/challengeContract.js`
- Rewrite: `src/utils/questMastery.js`
- Create: `tests/unit/soundSeekersEvidence.test.js`
- Rewrite: `tests/unit/questMastery.test.js`

**Interfaces:**
- Consumes: a materialized `QuestChallenge` and audio delivery status from Task 5.
- Produces: `createLiteracyDecision(input)`, `appendEvidence(events,event)`, `deriveConfusions(events)`, `evidenceIsIndependent(event)`, `practiceReadinessFor(targetId,events)`, and `QUEST_PRACTICE_THRESHOLDS` exported only from `questMastery.js`.

- [ ] **Step 1: Write failing evidence-integrity tests**

```js
test("movement emits no learning event and one answer emits one immutable event", () => {
  assert.equal(createLiteracyDecision({ action: { type: "move", x: 1 } }), null);
  const event = createLiteracyDecision(correctAnswerInput);
  assert.equal(event.evidenceKind, "practice");
  assert.equal(Object.isFrozen(event), true);
  assert.equal(appendEvidence([event], event).length, 1);
});

test("support and incomplete required audio cannot become independent", () => {
  assert.equal(evidenceIsIndependent(eventWith({ supportLevel: 1 })), false);
  assert.equal(evidenceIsIndependent(eventWith({ cueDelivery: "started" })), false);
  assert.equal(evidenceIsIndependent(eventWith({ cueDelivery: "completed" })), true);
});

test("two reskins of one mapping domain do not satisfy domain diversity", () => {
  const result = practiceReadinessFor("sh", [echoEvent, secondEchoEvent]);
  assert.equal(result.ready, false);
  assert.deepEqual(result.domains, ["phoneme_to_grapheme"]);
});
```

- [ ] **Step 2: Run the evidence tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersEvidence.test.js tests/unit/questMastery.test.js`

Expected: FAIL because the new decision contract and domain-based authority do not exist.

- [ ] **Step 3: Implement the challenge/event boundary and readiness derivation**

```js
export function createLiteracyDecision({ challenge, response, support, audio, journeyStep, ordinal, at }) {
  if (!challenge?.recordsDomain || response?.kind !== "literacy-answer") return null;
  const event = {
    id: `${challenge.attemptId}:${ordinal}`,
    target: challenge.targetId,
    domain: challenge.recordsDomain,
    correct: response.token === challenge.expectedToken,
    supportLevel: support.level,
    cueDelivery: audio.status,
    confusion: response.token === challenge.expectedToken ? null : response.token,
    word: challenge.wordId || null,
    position: challenge.position ?? null,
    mechanic: challenge.powerId,
    journeyStep,
    at,
    evidenceKind: "practice"
  };
  return Object.freeze(event);
}
```

Validate the challenge before use: internal answer data remains inside reducers; child view models never carry `isCorrect`; domain values are limited to the seven exact names; the same event ID is idempotent. `questMastery.js` derives recent accuracy, session spacing, legitimate domain diversity, and `exposure | building | ready_for_teaching_check`. It must never export or emit formal `SECURE`. Preserve the release bible's numeric thresholds in this one file only and remove numeric copies from matrices/tests touched by this plan.

- [ ] **Step 4: Run focused evidence, mastery, and reporting-boundary tests**

Run: `node --test tests/unit/soundSeekersEvidence.test.js tests/unit/questMastery.test.js tests/unit/learningPolicy.test.js`

Expected: PASS with no event fan-out, no motor evidence, and no practice-to-formal promotion.

- [ ] **Step 5: Commit truthful practice evidence**

```bash
git add src/features/soundSeekers/engine/evidence.js src/features/soundSeekers/engine/challengeContract.js src/utils/questMastery.js tests/unit/soundSeekersEvidence.test.js tests/unit/questMastery.test.js
git commit -m "feat: record truthful Sound Seekers practice evidence"
```

### Task 4: Add the monotonic journey clock, review scheduler, adaptive director, and correction ladder

**Files:**
- Create: `src/features/soundSeekers/engine/journeyClock.js`
- Create: `src/features/soundSeekers/engine/learningDirector.js`
- Rewrite: `src/utils/questReviewScheduler.js`
- Rewrite: `src/utils/questCorrection.js`
- Create: `tests/unit/soundSeekersJourneyClock.test.js`
- Create: `tests/unit/soundSeekersLearningDirector.test.js`
- Rewrite: `tests/unit/questReviewScheduler.test.js`
- Rewrite: `tests/unit/questCorrection.test.js`

**Interfaces:**
- Consumes: v2 evidence, pronunciation records, target teach history, and deterministic seed.
- Produces: `advanceJourney(trail, completedStopId)`, `dueAtJourneyStep(target,lastSeen,gap)`, `selectNextChallenge(context)`, `buildAuditedDistractors(context)`, and `nextCorrection(previous, miss)`.

- [ ] **Step 1: Write failing wraparound, confusion, and correction tests**

```js
test("review becomes due across the physical route wrap", () => {
  assert.equal(dueAtJourneyStep("sh", { journeyStep: 39 }, 3, 42), true);
  const trail = advanceJourney({ routeCursor: 40, journeyStep: 40, repairs: { mill: true } }, "s40");
  assert.equal(trail.routeCursor, 1);
  assert.equal(trail.journeyStep, 41);
  assert.deepEqual(trail.repairs, { mill: true });
});

test("director serves a taught homogeneous contrast from recent confusion", () => {
  const next = selectNextChallenge({ targetId: "short_i", confusions: { short_e: 3 }, taught: ["short_i", "short_e"], seed: 7 });
  assert.equal(next.contrastTargetId, "short_e");
  assert.equal(next.reason, "recent_confusion");
});

test("third miss models once then requires a fresh supported attempt", () => {
  const correction = nextCorrection({ missCount: 2 }, { selected: "short_e", intended: "short_i" });
  assert.equal(correction.modelOnce, true);
  assert.equal(correction.requiresFreshAttempt, true);
  assert.equal(correction.supportLevel, 3);
});
```

- [ ] **Step 2: Run the scheduler/director tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersJourneyClock.test.js tests/unit/soundSeekersLearningDirector.test.js tests/unit/questReviewScheduler.test.js tests/unit/questCorrection.test.js`

Expected: FAIL on missing journey-clock and director functions and on the old stop-index scheduler.

- [ ] **Step 3: Implement monotonic scheduling and the exact correction ladder**

```js
export function advanceJourney(trail, _completedStopId) {
  return {
    ...trail,
    routeCursor: trail.routeCursor >= 40 ? 1 : trail.routeCursor + 1,
    journeyStep: trail.journeyStep + 1
  };
}

export function dueAtJourneyStep(_target, lastSeen, gap, currentJourneyStep) {
  return currentJourneyStep - lastSeen.journeyStep >= gap;
}
```

The director prioritizes never-served eligible content, then recent low/decayed accuracy, then recent confusions, then due review. Distractors must be taught, from the same comparison family, unambiguous for the authored pronunciation, and position-balanced across deterministic seed samples. The correction record is shared across full and simplified views: first miss names the selection and replays the contrast; second isolates the important position and removes irrelevant load; third models once and requires a fresh supported response; later review queues an isomorphic challenge in another legitimate domain. No response time, path length, collision count, or device speed enters selection.

- [ ] **Step 4: Run focused tests and a deterministic 1,000-seed balance sample**

Run: `node --test tests/unit/soundSeekersJourneyClock.test.js tests/unit/soundSeekersLearningDirector.test.js tests/unit/questReviewScheduler.test.js tests/unit/questCorrection.test.js`

Expected: PASS; answer positions differ by no more than 5% in the seeded balance assertion.

- [ ] **Step 5: Commit the director and review clock**

```bash
git add src/features/soundSeekers/engine/journeyClock.js src/features/soundSeekers/engine/learningDirector.js src/utils/questReviewScheduler.js src/utils/questCorrection.js tests/unit/soundSeekersJourneyClock.test.js tests/unit/soundSeekersLearningDirector.test.js tests/unit/questReviewScheduler.test.js tests/unit/questCorrection.test.js
git commit -m "feat: add adaptive Sound Seekers review logic"
```

### Task 5: Make teaching, instructions, and cue delivery exact and testable

**Files:**
- Create: `src/features/soundSeekers/content/instructionContracts.js`
- Create: `src/features/soundSeekers/engine/teachSequence.js`
- Create: `src/features/soundSeekers/engine/audioDelivery.js`
- Modify: `src/utils/audio/cuePlayer.js`
- Create: `tools/generateSoundSeekersInstructionAudio.mjs`
- Create: `public/audio/quest-v2/instructions/SOURCE.md`
- Create: one `public/audio/quest-v2/instructions/<instructionId>.mp3` for every non-silent instruction contract
- Create: `tools/generateSoundSeekersContextualUnitAudio.mjs`
- Create: `public/audio/quest-v2/sound-units/SOURCE.md`
- Create: `public/audio/quest-v2/sound-units/schwa.mp3`
- Create: `public/audio/quest-v2/sound-units/ear_lax.mp3`
- Create: `public/audio/quest-v2/sound-units/ed_id.mp3`
- Create: `public/audio/quest-v2/sound-units/ure_no_y.mp3`
- Create: `public/audio/quest-v2/sound-units/once_onset.mp3`
- Modify: `src/data/phonemeAudioBank.js`
- Create: `tests/unit/soundSeekersInstructionContracts.test.js`
- Create: `tests/unit/soundSeekersTeachSequence.test.js`
- Create: `tests/unit/soundSeekersAudioDelivery.test.js`
- Modify: `tools/checkQuestIntegrity.js`

**Interfaces:**
- Consumes: stop target IDs, pronunciation records, audio manifest keys, and the seven evidence domains.
- Produces: `getInstructionContract(instructionId)`, `assertInstructionMatchesChallenge(contract,challenge)`, `createTeachSequence(stop,taughtTargetIds)`, `reduceTeachSequence(state,input)`, `createAudioDelivery(id)`, and `reduceAudioDelivery(state,event)`.

- [ ] **Step 1: Write failing exact-instruction, teach-all, and audio-lifecycle tests**

```js
test("instruction text, action, and evidence domain describe the same child action", () => {
  const contract = getInstructionContract("word-forge-place-tile");
  assert.deepEqual(contract, {
    instructionId: "word-forge-place-tile",
    childText: "Choose the grapheme for this sound.",
    childAudio: "quest/instructions/word-forge-place-tile",
    cue: "whole_word",
    expectedAction: "place_grapheme_tile",
    recordsDomain: "word_segmentation_encoding",
    silenceIsIntentional: false
  });
});

test("all six targets at s7 are taught before its first scored challenge", () => {
  const sequence = createTeachSequence(stop("s7"), []);
  assert.equal(sequence.items.length, 6);
  assert.equal(sequence.items.every(item => item.scored === false), true);
  assert.equal(sequence.nextPhase, "challenge");
});

test("audio-dependent evidence accepts completed delivery only", () => {
  let state = createAudioDelivery("cue-1");
  for (const event of ["loading", "started", "interrupted", "failed"]) {
    state = reduceAudioDelivery(state, { type: event });
    assert.notEqual(state.status, "completed");
  }
  assert.equal(reduceAudioDelivery(createAudioDelivery("cue-2"), { type: "completed" }).status, "completed");
});

test("every non-silent instruction resolves to a provenance-locked recording", () => {
  const source = readInstructionAudioSourceManifest();
  for (const contract of Object.values(SOUND_SEEKERS_INSTRUCTIONS).filter(item => !item.silenceIsIntentional)) {
    const record = source.assets.find(asset => asset.instructionId === contract.instructionId);
    assert.ok(record, contract.instructionId);
    assert.equal(record.childText, contract.childText);
    assert.equal(record.humanListeningApproved, false);
    assert.ok(fs.existsSync(publicPath(record.path)));
  }
});

test("all twenty-one contextual pronunciation blockers resolve to five candidate unit recordings", () => {
  const blocked = collectPronunciationAudioBlockers(SOUND_SEEKERS_WORDS);
  assert.deepEqual([...new Set(blocked.map(item => item.soundKey))].sort(), ["ear_lax", "ed_id", "once_onset", "schwa", "ure_no_y"]);
  for (const item of blocked) {
    assert.ok(getPhonemeAudio(item.soundKey), `${item.word}:${item.grapheme}:${item.soundKey}`);
  }
  assert.equal(validateShippingLexicon(SOUND_SEEKERS_WORDS, { release: true }).length, 0);
});
```

- [ ] **Step 2: Run the instruction/audio tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersInstructionContracts.test.js tests/unit/soundSeekersTeachSequence.test.js tests/unit/soundSeekersAudioDelivery.test.js`

Expected: FAIL because the new contracts and lifecycle reducer do not exist.

- [ ] **Step 3: Implement the reviewed child contract and teach checkpoint**

```js
export const CUE_DELIVERY_STATUSES = Object.freeze([
  "unavailable", "loading", "started", "completed", "interrupted", "failed"
]);

export function createAudioDelivery(id) {
  return Object.freeze({ id, status: "unavailable", startedAt: null, completedAt: null });
}
```

Author instruction contracts for teach, replay, and every decision point in all six powers. Reject underscore-bearing internal IDs in child text, mismatched expected action/domain, missing audio without `silenceIsIntentional: true`, or a scored target without a preceding teach record. Each teach item includes reviewed child text, audio key, grapheme display, child label, mouth/formation cue, anchor image, and worked example. `cuePlayer` reports lifecycle callbacks and ducks music during instruction; cancellation records `interrupted`, and playback rejection records `failed`. Checkpoints retain teach index but never convert a teach replay into scored evidence.

Generate one en-US instruction recording for every non-silent contract using the repository's existing approved production speech pipeline and voice configuration. `SOURCE.md` records instruction ID, exact child text, voice/model, generation date, duration, SHA-256, and `humanListeningApproved: false`; only a real direct listening review may change that field. The static gate rejects missing, stale-text, zero-duration, or unprovenanced clips. Do not substitute browser speech for a required shipping recording.

Generate five contextual-unit candidates to resolve the 21 blockers enumerated by Task 2: `schwa` for `a/again/amuse/complete/different/giant/listen/manure/obscure/the`; `ear_lax` for `clear/dear/fear/near/year`; `ed_id` for `landed/wanted`; `ure_no_y` for `manure/sure`; and `once_onset` for `one/once`. Register the exact paths in `phonemeAudioBank.js`, clear a record's blocker only when its key resolves, and make automated release validation pass. The source manifest records target IPA/ARPABET, anchor words, exact generation prompt, voice/model, duration, SHA-256, automated signal checks, and `humanListeningApproved: false`. This clears the missing-file blocker but not the direct human-listening gate.

- [ ] **Step 4: Run the complete foundation test set and integrity gate**

Run: `node --test tests/unit/soundSeekersStateV2.test.js tests/unit/soundSeekersPronunciationLexicon.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/soundSeekersJourneyClock.test.js tests/unit/soundSeekersLearningDirector.test.js tests/unit/soundSeekersInstructionContracts.test.js tests/unit/soundSeekersTeachSequence.test.js tests/unit/soundSeekersAudioDelivery.test.js tests/unit/questMastery.test.js tests/unit/questReviewScheduler.test.js tests/unit/questCorrection.test.js tests/unit/progressMerge.test.js`

Expected: PASS with pristine output.

Run: `npm run check:quest && npm test`

Expected: PASS; the repository unit count increases and no legacy test is weakened merely to pass.

- [ ] **Step 5: Commit the exact teaching and audio contract**

```bash
git add src/features/soundSeekers/content/instructionContracts.js src/features/soundSeekers/engine/teachSequence.js src/features/soundSeekers/engine/audioDelivery.js src/utils/audio/cuePlayer.js src/data/phonemeAudioBank.js tools/generateSoundSeekersInstructionAudio.mjs tools/generateSoundSeekersContextualUnitAudio.mjs public/audio/quest-v2/instructions public/audio/quest-v2/sound-units tests/unit/soundSeekersInstructionContracts.test.js tests/unit/soundSeekersTeachSequence.test.js tests/unit/soundSeekersAudioDelivery.test.js tools/checkQuestIntegrity.js
git commit -m "feat: make Sound Seekers teaching and audio exact"
```
