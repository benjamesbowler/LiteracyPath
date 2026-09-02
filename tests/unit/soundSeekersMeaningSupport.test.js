import test from "node:test";
import assert from "node:assert/strict";

import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import { SOUND_SEEKERS_CONNECTED_TEXT } from "../../src/features/soundSeekers/content/connectedText.js";
import {
  MEANING_SUPPORT_RECORDS,
  REQUIRED_ACTION_MEANING_WORD_IDS as REQUIRED_ACTION_MEANING_WORD_IDS_SOURCE
} from "../../src/features/soundSeekers/content/meaningSupportRecords.js";
import {
  ADVANCED_SCENE_TOKEN_IDS,
  REQUIRED_ACTION_MEANING_WORD_IDS,
  SOUND_SEEKERS_MEANING_SUPPORT,
  getMeaningSupport
} from "../../src/features/soundSeekers/content/meaningSupport.js";
import {
  ADVANCED_SCENE_TOKEN_IDS as ADVANCED_SCENE_TOKEN_IDS_SOURCE
} from "../../src/features/soundSeekers/content/connectedTextUsage.generated.js";

const exactActionIds = [
  "action", "bike", "bird", "boat", "book", "box", "bun", "by", "cake", "car", "cat", "cats",
  "chair", "city", "clap", "coin", "cube", "cup", "fiction", "frog", "hand", "hear", "home", "hot",
  "jam", "light", "little", "mat", "moon", "near", "night", "point", "pure", "rain", "rock", "ship",
  "sit", "sound", "spin", "stone", "storm", "theme", "thin", "thing", "tree", "truck"
];

test("meaning support exactly covers forty-eight action uses and authored advanced tokens", () => {
  const uses = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases)
    .filter(phase => ["word_forge", "blend_bridge"].includes(phase.powerId) && phase.wordId);
  assert.equal(uses.length, 48);
  assert.strictEqual(REQUIRED_ACTION_MEANING_WORD_IDS, REQUIRED_ACTION_MEANING_WORD_IDS_SOURCE);
  assert.strictEqual(ADVANCED_SCENE_TOKEN_IDS, ADVANCED_SCENE_TOKEN_IDS_SOURCE);
  assert.deepEqual(REQUIRED_ACTION_MEANING_WORD_IDS, exactActionIds);
  assert.deepEqual([...new Set(uses.map(phase => phase.wordId))].sort(), exactActionIds);
  const required = [...new Set([
    ...exactActionIds,
    ...SOUND_SEEKERS_CONNECTED_TEXT.flatMap(scene => [
      ...scene.advancedTokenIds,
      ...scene.advancedChildLabelTokenIds
    ])
  ])].sort();
  assert.deepEqual(MEANING_SUPPORT_RECORDS.map(record => record.wordId).sort(), required);
  assert.equal(SOUND_SEEKERS_MEANING_SUPPORT.length, required.length);
  for (const wordId of ADVANCED_SCENE_TOKEN_IDS) {
    assert.equal(getMeaningSupport(wordId).advancedReason, "new_concept");
  }
});

test("every support record is concrete, frozen, uniquely addressable, and post-decision gated", () => {
  const texts = new Set();
  const visuals = new Set();
  for (const record of SOUND_SEEKERS_MEANING_SUPPORT) {
    assert.equal(Object.isFrozen(record), true);
    assert.strictEqual(getMeaningSupport(record.wordId), record);
    assert.deepEqual(Object.keys(record), [
      "wordId", "childDefinition", "actionPrompt", "contrastPrompt", "visualSemanticId",
      "audioKey", "ageBand", "ellSupport", "advancedReason", "answerLeakPolicy"
    ]);
    assert.deepEqual(Object.keys(record.ellSupport), ["oralBridge", "gesturePrompt"]);
    assert.equal(record.ageBand, "5-8");
    assert.equal(record.audioKey, `quest/meaning/${record.wordId}`);
    assert.equal(record.answerLeakPolicy, "post_decision_or_non_assessed_help");
    assert.match(record.childDefinition, /\s/u);
    assert.match(record.actionPrompt, /\s/u);
    assert.match(record.contrastPrompt, /\s/u);
    assert.equal(texts.has(record.childDefinition), false);
    assert.equal(visuals.has(record.visualSemanticId), false);
    texts.add(record.childDefinition);
    visuals.add(record.visualSemanticId);
  }
  assert.equal(getMeaningSupport("missing-word"), null);
});
