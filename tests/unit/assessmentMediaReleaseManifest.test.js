import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  assessmentHfwAudioWiring,
  assessmentMediaWaivers,
  assessmentMediaWiring
} from "../../src/content/assessments/assessmentMediaReleaseManifest.js";
import { loadCoreQuestionPool, repoRoot } from "../../tools/phonicsRuntimeUtils.js";

function publicFile(assetPath) {
  return path.join(repoRoot, "public", assetPath.replace(/^\//, ""));
}

test("every release media wiring target exists and has nonzero bytes", () => {
  const paths = [
    ...assessmentMediaWiring.map(entry => entry.filePath),
    ...Object.values(assessmentHfwAudioWiring)
  ];
  assert.ok(paths.length > 0);
  for (const assetPath of paths) {
    assert.equal(assetPath.startsWith("/"), true, assetPath);
    assert.equal(fs.existsSync(publicFile(assetPath)), true, assetPath);
    assert.ok(fs.statSync(publicFile(assetPath)).size > 0, assetPath);
  }
});
test("media waivers are explicit, review-dated, and absent from the runtime pool", () => {
  const runtimeIds = new Set(loadCoreQuestionPool().map(question => question.id));
  const seen = new Set();
  for (const waiver of assessmentMediaWaivers) {
    assert.ok(waiver.skillId);
    assert.ok(waiver.owner);
    assert.ok(waiver.reason.length >= 40);
    assert.ok(Date.parse(waiver.reviewBy) > Date.now());
    assert.equal(waiver.excludeFromRuntime, true);
    for (const questionId of waiver.questionIds) {
      assert.equal(seen.has(questionId), false, questionId);
      assert.equal(runtimeIds.has(questionId), false, questionId);
      seen.add(questionId);
    }
  }
});

test("configured question wiring is unique per question and media type", () => {
  const seen = new Set();
  for (const entry of assessmentMediaWiring) {
    assert.ok(entry.source);
    assert.ok(entry.license);
    assert.ok(entry.reviewStatus);
    assert.ok(entry.pronunciationVariant);
    for (const questionId of entry.questionIds) {
      const key = `${questionId}:${entry.mediaType}`;
      assert.equal(seen.has(key), false, key);
      seen.add(key);
    }
  }
});
