import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { SOUND_SEEKERS_CONNECTED_TEXT } from "../../src/features/soundSeekers/content/connectedText.js";
import {
  ADVANCED_SCENE_TOKEN_CONTENT_HASH,
  ADVANCED_SCENE_TOKEN_COUNT,
  ADVANCED_SCENE_TOKEN_IDS,
  CONNECTED_TEXT_USAGE
} from "../../src/features/soundSeekers/content/connectedTextUsage.generated.js";

const protectedPaths = [
  "src/features/soundSeekers/content/pronunciationRecords.js",
  "src/features/soundSeekers/content/pronunciationCorpusInvariant.generated.js",
  "src/features/soundSeekers/content/pronunciationLexicon.js",
  "src/features/soundSeekers/content/wordMeanings.js",
  "tools/buildSoundSeekersPronunciationLexicon.mjs"
];
const hash = value => createHash("sha256").update(value).digest("hex");

test("generated usage is sorted, occurrence-preserving, and hash-bound", () => {
  const advanced = [...new Set(SOUND_SEEKERS_CONNECTED_TEXT.flatMap(scene => [
    ...scene.advancedTokenIds,
    ...scene.advancedChildLabelTokenIds
  ]))].sort();
  assert.deepEqual(ADVANCED_SCENE_TOKEN_IDS, advanced);
  assert.equal(ADVANCED_SCENE_TOKEN_COUNT, advanced.length);
  assert.equal(ADVANCED_SCENE_TOKEN_CONTENT_HASH, hash(JSON.stringify(advanced)));
  assert.deepEqual(CONNECTED_TEXT_USAGE.map(record => record.wordId),
    [...CONNECTED_TEXT_USAGE.map(record => record.wordId)].sort());
  for (const record of CONNECTED_TEXT_USAGE) {
    assert.deepEqual(Object.keys(record), ["wordId", "uses"]);
    for (const use of record.uses) {
      assert.deepEqual(Object.keys(use), ["sceneId", "stopId", "surface", "ordinal"]);
      assert.equal(["running_text", "prompt", "text_option", "accessible_label", "meaning_support"]
        .includes(use.surface), true);
      assert.equal(Number.isInteger(use.ordinal) && use.ordinal >= 0, true);
    }
  }
});

test("usage generator check and write modes cannot mutate pronunciation authority", () => {
  const before = Object.fromEntries(protectedPaths.map(path => [path, hash(readFileSync(path))]));
  for (const args of [[], ["--write"]]) {
    const result = spawnSync(process.execPath, ["tools/buildSoundSeekersConnectedTextUsage.mjs", ...args], {
      encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
  const after = Object.fromEntries(protectedPaths.map(path => [path, hash(readFileSync(path))]));
  assert.deepEqual(after, before);
});
