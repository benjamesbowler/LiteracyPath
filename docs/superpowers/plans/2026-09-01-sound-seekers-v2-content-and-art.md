# Sound Seekers v2 Content and Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the complete 40-expedition, 60-heart-word, 40-scene, eight-biome adventure and its unified illustrated 2D visual system.

**Architecture:** Canonical feature-local catalogs hold expeditions, heart words, connected text, meaning, cast arcs, and biome manifests; the old sequence remains only a verified curriculum-target input until cutover. Static validators prove order, reachability, decodability, semantic identity, and provenance. Eight project-bound background illustrations supply quiet depth while code-native layered scenery, landmarks, characters, props, interaction plates, particles, and text keep gameplay coherent, responsive, accessible, and stateful.

**Tech Stack:** JavaScript ES modules, React/SVG/CSS, Node `node:test`, Sharp asset inspection, OpenAI image generation, Playwright screenshot/semantic checks.

**Spec:** `docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md`

## Global Constraints

- There are exactly eight chapters and 40 authored stops, five stops per chapter.
- Every stop declares arrival, teach, first use, deepening, Wonder/transfer, payoff, safe resume, and at least one persistent repair beat.
- Each chapter declares five persistent world-state beats, a resident relationship arc, one curriculum-representative Wonder moment, and a transfer boss.
- Every connected-text scene is reachable on a normal first visit; assessed choices have one defensible text-supported answer and narrative choices emit no mastery evidence.
- Every connected-text token resolves through the canonical pronunciation lexicon or is a declared previously introduced heart word.
- All 60 heart words are introduced and served within the first 40-stop journey, with no more than two new introductions at one stop.
- Heart-word recognition, heart-part mapping, encoding, and sentence use remain separate activity/evidence records.
- Every Word Forge and Blend Bridge word has an approved child-safe meaning reference; meaning art must not reveal the decoding answer.
- Every chapter has a unique semantic 2D identity, at least three visual depth layers, five landmarks with dormant/repaired states, a cast, prop/reward family, route material, task camera, and simplified/reduced-motion variants.
- Art uses rounded readable silhouettes, restrained painted texture, consistent upper-left lighting, warm material depth, quiet backgrounds, and strongest local contrast on interactables.
- Raster art contains no text, logos, watermarks, or imitation of third-party characters; child text and grapheme plates are code-native.
- Every added raster has project provenance in `public/game-assets/sound-seekers/v2/SOURCE.md`; rejected variants are removed.

---

### Task 1: Author the 40-expedition campaign and five-beat chapter arcs

**Files:**
- Create: `src/features/soundSeekers/content/expeditions.js`
- Create: `src/features/soundSeekers/content/chapters/seedwakeMeadow.js`
- Create: `src/features/soundSeekers/content/chapters/riverGardens.js`
- Create: `src/features/soundSeekers/content/chapters/fossilCanyon.js`
- Create: `src/features/soundSeekers/content/chapters/forgeSettlement.js`
- Create: `src/features/soundSeekers/content/chapters/glassMarsh.js`
- Create: `src/features/soundSeekers/content/chapters/stormCoast.js`
- Create: `src/features/soundSeekers/content/chapters/lanternForest.js`
- Create: `src/features/soundSeekers/content/chapters/starReach.js`
- Modify: `src/data/questSequence.js`
- Modify: `src/data/questChapters.js`
- Create: `tests/unit/soundSeekersExpeditions.test.js`

**Interfaces:**
- Consumes: stable stop IDs, target IDs, and curriculum order from `questSequence.js`; the six power IDs; foundation instruction IDs.
- Produces: `SOUND_SEEKERS_CHAPTERS`, `SOUND_SEEKERS_EXPEDITIONS`, `getExpedition(stopId)`, and an expedition shape `{ id, stopId, chapterId, title, residentId, arrival, teachTargetIds, phases, wonder, transfer, payoff, resume }`.

- [ ] **Step 1: Write failing structural and cognitive-variety tests**

```js
test("campaign has forty complete expeditions and five per chapter", () => {
  assert.equal(SOUND_SEEKERS_EXPEDITIONS.length, 40);
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    assert.equal(SOUND_SEEKERS_EXPEDITIONS.filter(stop => stop.chapterId === chapter.id).length, 5);
    assert.equal(chapter.repairBeatIds.length, 5);
    assert.ok(chapter.wonderId);
    assert.ok(chapter.bossTransferId);
  }
});

test("every expedition contains the complete learning-game loop", () => {
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    assert.deepEqual(expedition.phases.map(phase => phase.kind), ["arrival", "teach", "challenge", "challenge", "wonder", "transfer", "payoff"]);
    assert.ok(expedition.payoff.repairId);
    assert.ok(expedition.payoff.relationshipBeatId);
    assert.ok(expedition.resume.safePhaseIds.length >= 5);
  }
});

test("secondary challenges remain authored and no generic collision family exists", () => {
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    for (const phase of expedition.phases.filter(phase => ["challenge", "transfer"].includes(phase.kind))) {
      assert.ok(["echo_search", "contrast_sort", "word_forge", "blend_bridge", "memory_delivery", "story_power"].includes(phase.powerId));
      assert.ok(phase.contextId);
      assert.notEqual(phase.powerId, "generic_choice");
    }
  }
});
```

- [ ] **Step 2: Run the expedition test and confirm the red state**

Run: `node --test tests/unit/soundSeekersExpeditions.test.js`

Expected: FAIL because the v2 campaign catalog does not exist.

- [ ] **Step 3: Author all five missions in each chapter**

```js
export const seedwakeMeadow = Object.freeze({
  id: "seedwake-meadow",
  stopIds: ["s1", "s2", "s3", "s4", "s5"],
  repairBeatIds: ["wake-seeds", "mend-hedge", "light-mill", "raise-bridge", "open-meadow-gate"],
  wonderId: "sound-ripples-wake-the-meadow",
  bossTransferId: "bramble-gate-novel-decode"
});
```

Write distinct chapter arcs:

- Seedwake Meadow relights a shared dawn path through sound discovery and first word construction.
- River Gardens classifies and delivers sound cargo to restore canals and terraces.
- Fossil Canyon blends decoded trail marks to reconnect an excavation team.
- Forge Settlement encodes working instructions that rebuild copper/iron machines.
- Glass Marsh distinguishes reflected confusions to reveal a safe route.
- Storm Coast remembers and applies cues to restore shelters and a lighthouse lens.
- Lantern Forest applies controlled text to rebuild a living map.
- Star Reach integrates the powers to reconnect the sky road through novel transfer.

Each fifth stop is a boss with controlled novel application, not faster repetition. Mark imaginary boss names explicitly as imaginary and use `novel_decoding`. `questSequence.js` becomes stable route/target references, while the new catalog owns story, phase, mechanic, repair, and payoff data. `questChapters.js` becomes the one eight-chapter identity registry.

- [ ] **Step 4: Run campaign and curriculum-order checks**

Run: `node --test tests/unit/soundSeekersExpeditions.test.js tests/unit/questSequence.test.js`

Expected: PASS with 40 reachable authored missions and no ahead-of-teach target.

Run: `npm run check:quest`

Expected: PASS after its catalog adapter recognizes the v2 source.

- [ ] **Step 5: Commit the authored campaign**

```bash
git add src/features/soundSeekers/content/expeditions.js src/features/soundSeekers/content/chapters src/data/questSequence.js src/data/questChapters.js tests/unit/soundSeekersExpeditions.test.js
git commit -m "feat: author forty Sound Seekers expeditions"
```

### Task 2: Author the complete heart-word deck and bounded coverage scheduler

**Files:**
- Create: `src/features/soundSeekers/content/heartWords.js`
- Create: `src/features/soundSeekers/engine/contentCoverage.js`
- Create: `tests/unit/soundSeekersHeartWords.test.js`
- Create: `tests/unit/soundSeekersContentCoverage.test.js`

**Interfaces:**
- Consumes: the existing declared 60-word set, pronunciation records, 40 stop IDs, and v2 persisted `contentDecks`.
- Produces: `SOUND_SEEKERS_HEART_WORDS`, `createHeartWordDeck()`, `serveHeartWord(deck,{stopId,journeyStep,seed})`, `recordHeartWordUse(deck,result)`, and `coverageStatus(state)`.

- [ ] **Step 1: Write failing 60-word reachability and separation tests**

```js
test("all sixty heart words have complete mappings and bounded introductions", () => {
  assert.equal(SOUND_SEEKERS_HEART_WORDS.length, 60);
  for (const record of SOUND_SEEKERS_HEART_WORDS) {
    assert.ok(record.pronunciationId);
    assert.ok(record.regularParts.length >= 1);
    assert.ok(record.heartParts.length >= 1);
    assert.ok(record.meaningId);
    assert.ok(record.introductionStopId);
  }
  for (const stopId of STOP_IDS) {
    assert.ok(SOUND_SEEKERS_HEART_WORDS.filter(word => word.introductionStopId === stopId).length <= 2);
  }
});

test("a deterministic first journey serves all sixty without starvation", () => {
  let deck = createHeartWordDeck();
  const served = new Set();
  for (let journeyStep = 1; journeyStep <= 40; journeyStep += 1) {
    for (let slot = 0; slot < 2; slot += 1) {
      const result = serveHeartWord(deck, { stopId: `s${journeyStep}`, journeyStep, seed: journeyStep * 10 + slot });
      if (result.wordId) served.add(result.wordId);
      deck = recordHeartWordUse(deck, result);
    }
  }
  assert.equal(served.size, 60);
});

test("heart-word actions cannot create GPC evidence", () => {
  for (const domain of heartWordActivityDomains()) assert.equal(domain === "phoneme_to_grapheme", false);
});
```

- [ ] **Step 2: Run the deck tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentCoverage.test.js`

Expected: FAIL because the 60 canonical records and persisted deck do not exist.

- [ ] **Step 3: Author all records and the never-served-first scheduler**

```js
export const SOUND_SEEKERS_HEART_WORDS = Object.freeze([
  {
    id: "hw:the",
    display: "the",
    pronunciationId: "the-function-word",
    regularParts: [{ grapheme: "th", soundKey: "voiced_th" }],
    heartParts: [{ grapheme: "e", soundKey: "schwa" }],
    meaningId: "the-determiner",
    introductionStopId: "s1",
    eligibleContexts: ["recognition", "heart_part_mapping", "encoding", "sentence_use"]
  }
]);
```

Distribute zero, one, or two introductions per stop so the total is 60. The persisted scheduler serves eligible never-served introduced words first, then due review by monotonic journey step, then least-recently served. A due `hw:` target must always materialize a heart-word activity. Store recognition, heart-part mapping, encoding, and sentence-use visits independently; none fan out into GPC evidence. Add coverage queues for stories, alternative pronunciations, morphology, and transfer so every category has a finite due bound.

- [ ] **Step 4: Run 1,000 seeded journeys and merge/resume fixtures**

Run: `node --test tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/soundSeekersStateV2.test.js`

Expected: PASS with all 60 served by stop 40 for every tested seed, no repeats before all eligible unseen words, and identical continuation after checkpoint restore.

- [ ] **Step 5: Commit the complete heart-word journey**

```bash
git add src/features/soundSeekers/content/heartWords.js src/features/soundSeekers/engine/contentCoverage.js tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentCoverage.test.js
git commit -m "feat: complete the Sound Seekers heart-word journey"
```

### Task 3: Author 40 connected-text scenes, meaning records, vocabulary support, and resident relationships

**Files:**
- Create: `src/features/soundSeekers/content/connectedText.js`
- Extend: `src/features/soundSeekers/content/wordMeanings.js`
- Create: `src/features/soundSeekers/content/castArcs.js`
- Create: `tests/unit/soundSeekersConnectedText.test.js`
- Create: `tests/unit/soundSeekersWordMeanings.test.js`
- Create: `tests/unit/soundSeekersCastArcs.test.js`

**Interfaces:**
- Consumes: taught-target order, pronunciation lexicon, heart-word introductions, expedition context/repair IDs.
- Produces: `SOUND_SEEKERS_CONNECTED_TEXT`, `getConnectedText(sceneId)`, `validateSceneAtStop(scene,stopId)`, `SOUND_SEEKERS_CAST`, and complete meaning records.

- [ ] **Step 1: Write failing reachability, decodability, and meaning tests**

```js
test("every stop has one reachable controlled micro-scene", () => {
  assert.equal(SOUND_SEEKERS_CONNECTED_TEXT.length, 40);
  assert.deepEqual(SOUND_SEEKERS_CONNECTED_TEXT.map(scene => scene.stopId), STOP_IDS);
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) assert.deepEqual(validateSceneAtStop(scene, scene.stopId), []);
});

test("assessed choices have one defensible answer and narrative choices record no evidence", () => {
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    if (scene.choice.kind === "assessed") assert.equal(scene.choice.options.filter(option => option.correct).length, 1);
    if (scene.choice.kind === "narrative") assert.equal(scene.choice.recordsDomain, null);
  }
});

test("each chapter cast remembers prior literacy help", () => {
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const beats = SOUND_SEEKERS_CAST[chapter.id].relationshipBeats;
    assert.equal(beats.length, 5);
    assert.ok(beats.slice(1).every(beat => beat.recallsRepairId));
  }
});
```

- [ ] **Step 2: Run content tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersWordMeanings.test.js tests/unit/soundSeekersCastArcs.test.js`

Expected: FAIL because the complete text and relationship sources do not exist.

- [ ] **Step 3: Author phrase-to-passage transfer and semantic consequences**

```js
export const SOUND_SEEKERS_CONNECTED_TEXT = Object.freeze([
  {
    id: "scene-s1-seed-lights",
    stopId: "s1",
    level: "phrase",
    text: "A mat.",
    tokenIds: ["hw:a", "mat"],
    heartWordIds: ["hw:a"],
    audioKey: "quest/scenes/s1-seed-lights",
    choice: {
      kind: "assessed",
      prompt: "What did the words name?",
      options: [{ id: "mat", label: "a mat", correct: true }, { id: "gate", label: "a gate", correct: false }],
      recordsDomain: "connected_text_transfer"
    },
    consequenceId: "meadow-mat-unrolls"
  }
]);
```

Write five scenes per chapter, growing from phrase to sentence to short passage across the route. Every running word is a lexicon token or previously introduced heart word. Assessed prompts have one text-supported answer; open story branches say “Your story choice,” persist a consequence, and record no correctness. Give advanced vocabulary an oral explanation, age metadata, ELL support, reviewed meaning action/image cue, and an answer-leak declaration. Give each chapter four named residents plus a guide; all five relationship beats recall an earlier repair and request later transfer. Word Forge and Blend Bridge end in an action that demonstrates meaning without contributing additional evidence.

- [ ] **Step 4: Run content coverage and integrity gates**

Run: `node --test tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersWordMeanings.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersContentCoverage.test.js`

Expected: PASS with 40 scenes, 40 reachable consequences, and no ahead-of-sequence text.

Run: `npm run check:quest`

Expected: PASS with connected-text and meaning validation enabled.

- [ ] **Step 5: Commit connected meaning and story transfer**

```bash
git add src/features/soundSeekers/content/connectedText.js src/features/soundSeekers/content/wordMeanings.js src/features/soundSeekers/content/castArcs.js tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersWordMeanings.test.js tests/unit/soundSeekersCastArcs.test.js
git commit -m "feat: author Sound Seekers connected stories"
```

### Task 4: Define eight semantic biome kits and the code-native visual language

**Files:**
- Create: `src/features/soundSeekers/content/biomeKits.js`
- Create: `src/features/soundSeekers/visual/visualTokens.js`
- Create: `src/features/soundSeekers/visual/LayeredBiome.jsx`
- Create: `src/features/soundSeekers/visual/CharacterSystem.jsx`
- Create: `src/features/soundSeekers/visual/Landmark.jsx`
- Create: `src/features/soundSeekers/visual/visual-system.css`
- Create: `tests/unit/soundSeekersBiomeKits.test.js`
- Create: `tests/unit/soundSeekersVisualSemantic.test.js`

**Interfaces:**
- Consumes: eight chapter IDs, cast records, expedition repair IDs, and assets generated in Task 5.
- Produces: `SOUND_SEEKERS_BIOME_KITS`, `getBiomeKit(chapterId)`, `<LayeredBiome kit worldState profile />`, `<SoundSeekersCharacter characterId pose palette />`, and `<Landmark landmark state />`.

- [ ] **Step 1: Write failing semantic-identity and coherence tests**

```js
test("eight unique kits each declare all required visual contracts", () => {
  assert.equal(SOUND_SEEKERS_BIOME_KITS.length, 8);
  assert.equal(new Set(SOUND_SEEKERS_BIOME_KITS.map(kit => kit.background.src)).size, 8);
  for (const kit of SOUND_SEEKERS_BIOME_KITS) {
    assert.equal(kit.layers.length >= 3, true);
    assert.equal(kit.landmarks.length, 5);
    assert.ok(kit.landmarks.every(landmark => landmark.states.includes("dormant") && landmark.states.includes("repaired")));
    assert.ok(kit.simplifiedScene);
    assert.ok(kit.reducedMotion);
  }
});

test("forge, coast, and observatory identity does not depend on text labels", () => {
  assert.ok(getBiomeKit("forge-settlement").semanticObjects.includes("furnace"));
  assert.ok(getBiomeKit("storm-coast").semanticObjects.includes("sea-cliff"));
  assert.ok(getBiomeKit("star-reach").semanticObjects.includes("observatory"));
});

test("cast and creator use the same silhouette and pose vocabulary", () => {
  for (const character of Object.values(SOUND_SEEKERS_CAST).flatMap(chapter => chapter.characters)) {
    assert.equal(character.styleId, "sound-seekers-painted-shape-v2");
    assert.deepEqual(character.requiredPoses, ["idle", "explain", "encourage", "celebrate", "repair"]);
  }
});
```

- [ ] **Step 2: Run visual-contract tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersVisualSemantic.test.js`

Expected: FAIL because biome manifests and unified visual components do not exist.

- [ ] **Step 3: Implement manifests, layered shapes, characters, and landmarks**

```js
export const SOUND_SEEKERS_BIOME_KITS = Object.freeze([
  {
    id: "forge-settlement",
    background: { src: "/game-assets/sound-seekers/v2/biomes/forge-settlement/background.webp", provenanceId: "ssv2-forge-bg" },
    palette: { sky: "#614b49", shadow: "#251f26", route: "#9f6b42", interactable: "#ffe58a" },
    lighting: "upper-left ember",
    semanticObjects: ["furnace", "anvil", "copper-machine", "rail"],
    layers: ["background-raster", "midground-machines", "foreground-route"],
    landmarks: forgeLandmarks,
    simplifiedScene: { decorativeDensity: 0.25, particles: 0 },
    reducedMotion: { transition: "outline-opacity-final-state" }
  }
]);
```

Give each kit a unique background, palette/light direction, code-native midground/foreground layer vocabulary, route material/topology, five repairable landmarks, four residents plus guide, interactable prop family, collectible/reward family, task-camera composition, Wonder effect, simplified density, and reduced-motion replacement. SVG characters use shared proportions, outline weight, face/eyeline placement, body slots, material palette, and pose names; palette/accessory customization feeds the same component used in-world. Graphemes, captions, controls, focus, sound boxes, masks, particles, and target plates remain code-native. Interactables always have the highest local contrast priority.

- [ ] **Step 4: Run kit/component tests and render static visual fixtures**

Run: `node --test tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersVisualSemantic.test.js`

Expected: PASS with eight unique kits, 40 landmark state pairs, and one cast vocabulary.

Run: `npm run build`

Expected: PASS with no missing asset imports; Task 5 supplies the raster files before this plan completes.

- [ ] **Step 5: Commit the coherent visual system**

```bash
git add src/features/soundSeekers/content/biomeKits.js src/features/soundSeekers/visual tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersVisualSemantic.test.js
git commit -m "feat: define eight Sound Seekers biome kits"
```

### Task 5: Generate, inspect, optimize, and provenance-lock eight project-bound biome backgrounds

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
- Create: `tools/checkSoundSeekersV2Assets.mjs`
- Create: `tests/unit/soundSeekersAssetManifest.test.js`

**Interfaces:**
- Consumes: Task 4 biome semantic objects, palettes, lighting, and runtime crop requirements.
- Produces: eight 16:9 quiet-background WebP images, eight manifest records with hashes/dimensions/provenance, and `npm run check:sound-seekers-art`.

- [ ] **Step 1: Write the failing asset/provenance test**

```js
test("every biome background exists, is unique, large enough, and provenance-locked", async () => {
  const manifest = readSoundSeekersSourceManifest();
  assert.equal(manifest.assets.length, 8);
  assert.equal(new Set(manifest.assets.map(asset => asset.sha256)).size, 8);
  for (const asset of manifest.assets) {
    const meta = await sharp(publicPath(asset.path)).metadata();
    assert.ok(meta.width >= 1536 && meta.height >= 864);
    assert.equal(asset.containsText, false);
    assert.equal(asset.automatedCropInspected, true);
    assert.equal(asset.humanCropReviewed, false);
  }
});
```

- [ ] **Step 2: Run the asset test and confirm the red state**

Run: `node --test tests/unit/soundSeekersAssetManifest.test.js`

Expected: FAIL because the v2 asset root and SOURCE manifest do not exist.

- [ ] **Step 3: Generate one coherent background per biome with the image-generation skill**

Read `/Users/benjaminbowler/.codex/skills/.system/imagegen/SKILL.md` in full before generation. Make eight separate image-generation calls, one for each biome. Use this shared art-direction block verbatim in every call:

```text
Wide 16:9 environmental background for a premium early-literacy 2D adventure game, hand-painted shape-led storybook style, rounded readable silhouettes, restrained paper-and-gouache texture, consistent upper-left lighting, quiet depth, child-safe, coherent warm material rendering, wide clear lower-middle gameplay lane, subdued contrast behind play space, no characters, no interface, no letters, no words, no logo, no watermark, no border. The image is background depth only; interactive objects will be drawn in code.
```

Append exactly one biome block per call:

- Seedwake Meadow: dawn pasture, waking seed lanterns, living hedges, warm wood, pale gold and fresh green.
- River Gardens: water channels, garden terraces, sluices, reeds, ceramic markers, turquoise and terracotta.
- Fossil Canyon: layered sandstone shelves, ancient tracks, bone arches, amber afternoon light.
- Forge Settlement: working furnaces, dark stone, copper and iron machines, rails, controlled ember glow.
- Glass Marsh: reflective jade pools, glass reeds, mist, refracted safe paths, cool green light.
- Storm Coast: sea cliffs, spray, wind instruments, timber shelters, storm clearing toward warm light.
- Lantern Forest: deep layered woods, root bridges, hanging lantern paths, moss and muted gold.
- Star Reach: high observatory terraces, comet stairs, readable celestial mechanisms, indigo and warm starlight.

Move the accepted generated file to its exact target path, convert losslessly or visually losslessly to WebP with Sharp, and inspect each output at original resolution using the image-view tool. Reject any embedded glyph/text, central clutter, semantic mismatch, unsafe crop, inconsistent lighting/style, or watermarked output; delete rejected variants. Record generation date, exact prompt, model/tool, dimensions, SHA-256, review note, `containsText: false`, `automatedCropInspected: true`, and `humanCropReviewed: false` in SOURCE.md. A human may change the final field only after a direct review; automated inspection must not impersonate that gate.

- [ ] **Step 4: Run asset, build, and semantic crop checks**

Run: `node tools/checkSoundSeekersV2Assets.mjs && node --test tests/unit/soundSeekersAssetManifest.test.js tests/unit/soundSeekersBiomeKits.test.js`

Expected: PASS with eight unique hashes, valid dimensions, exact manifest matches, and no undeclared raster.

Run: `npm run build`

Expected: PASS without broken asset URLs.

- [ ] **Step 5: Commit the inspected biome art**

```bash
git add public/game-assets/sound-seekers/v2 src/features/soundSeekers/content/biomeKits.js tools/checkSoundSeekersV2Assets.mjs tests/unit/soundSeekersAssetManifest.test.js package.json
git commit -m "feat: add eight Sound Seekers biome backgrounds"
```

### Task 6: Add content/art integrity and rendered semantic review surfaces

**Files:**
- Extend: `tools/checkQuestIntegrity.js`
- Create: `tools/checkSoundSeekersVisualSemantic.mjs`
- Modify: `tools/shootQuest.mjs`
- Create: `tests/browser/sound-seekers-visual-semantic.spec.js`
- Create: `tests/browser/sound-seekers-content-playthrough.spec.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: all canonical catalogs, biome manifests/assets, production preview route, and visible repair/scene states.
- Produces: `check:sound-seekers-content`, `check:sound-seekers-art`, and screenshot coverage for eight maps, 40 mission task states, eight Wonders, eight bosses, full/simplified/reduced-motion, 320px portrait/landscape, and 200% zoom.

- [ ] **Step 1: Write failing browser and static release assertions**

```js
test("all chapters are semantically recognizable without their labels", async ({ page }) => {
  for (const fixture of [
    ["forge-settlement", "furnace"],
    ["storm-coast", "sea-cliff"],
    ["star-reach", "observatory"]
  ]) {
    await page.goto(`/quest-preview.html?chapter=${fixture[0]}&labels=hidden`);
    await expect(page.getByTestId("biome-scene")).toHaveAttribute("data-semantic-object", new RegExp(fixture[1]));
  }
});

test("forty first visits expose forty connected scenes and repair payoffs", async ({ page }) => {
  for (let stop = 1; stop <= 40; stop += 1) {
    await page.goto(`/quest-preview.html?stop=s${stop}&phase=transfer`);
    await expect(page.getByTestId("connected-text")).toBeVisible();
    await expect(page.getByTestId("repair-preview")).toHaveAttribute("data-stop", `s${stop}`);
  }
});
```

- [ ] **Step 2: Run the new gates and confirm the red state**

Run: `npm run check:sound-seekers-content`

Expected: FAIL until the package script and complete validator are present.

Run: `npx playwright test tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-playthrough.spec.js --config=playwright.quest.config.js`

Expected: FAIL until every preview state and semantic attribute exists.

- [ ] **Step 3: Implement the complete content/art truth gate**

Fail static checks on missing/duplicate pronunciation, audio, meaning or art references; untaught scored targets; invalid distractors; unreachable heart words, review items, stories, alternative pronunciations, morphology, or transfer; text beyond the readable set; heart words used before introduction; missing repair/Wonder/boss/relationship beats; fewer than five landmarks; duplicate biome backgrounds; answer-bearing art; missing provenance; internal IDs in child text; or incomplete instruction contracts. `shootQuest` captures campaign, teach-all, six powers, workbench, correction, repair, reward, journal, eight Wonders, eight bosses, and every accessibility profile. Keep screenshot rendering deterministic via fixed seed and disabled nonessential motion.

- [ ] **Step 4: Run static, rendered, unit, and build verification**

Run: `npm run check:sound-seekers-content && npm run check:sound-seekers-art`

Expected: PASS.

Run: `node --test tests/unit/soundSeekersExpeditions.test.js tests/unit/soundSeekersHeartWords.test.js tests/unit/soundSeekersContentCoverage.test.js tests/unit/soundSeekersConnectedText.test.js tests/unit/soundSeekersWordMeanings.test.js tests/unit/soundSeekersCastArcs.test.js tests/unit/soundSeekersBiomeKits.test.js tests/unit/soundSeekersVisualSemantic.test.js tests/unit/soundSeekersAssetManifest.test.js`

Expected: PASS with pristine output.

Run: `npx playwright test tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-playthrough.spec.js --config=playwright.quest.config.js`

Expected: PASS; screenshots are then inspected directly and logged as visual-review evidence, not inferred from Playwright alone.

- [ ] **Step 5: Commit the content and art release gates**

```bash
git add tools/checkQuestIntegrity.js tools/checkSoundSeekersVisualSemantic.mjs tools/shootQuest.mjs tests/browser/sound-seekers-visual-semantic.spec.js tests/browser/sound-seekers-content-playthrough.spec.js package.json
git commit -m "test: gate Sound Seekers content and art"
```
