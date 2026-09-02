import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { CONNECTED_TEXT_RECORDS } from "../../src/features/soundSeekers/content/connectedTextRecords.js";
import { MEANING_SUPPORT_RECORDS } from "../../src/features/soundSeekers/content/meaningSupportRecords.js";

function parseSource() {
  const markdown = readFileSync("public/audio/quest-v2/SOURCE.md", "utf8");
  const match = /```json\n([\s\S]+?)\n```/u.exec(markdown);
  assert.ok(match);
  return JSON.parse(match[1]);
}

test("scene audio manifest is exact, byte-bound, and mechanically honest", () => {
  const expected = [
    ...CONNECTED_TEXT_RECORDS.flatMap(scene => [
      { assetId: `${scene.id}:text`, kind: "scene_text", ownerId: scene.id, text: scene.text,
        path: `/audio/quest-v2/scenes/${scene.id}-text.mp3` },
      { assetId: `${scene.id}:prompt`, kind: "scene_prompt", ownerId: scene.id, text: scene.prompt.text,
        path: `/audio/quest-v2/scenes/${scene.id}-prompt.mp3` }
    ]),
    ...MEANING_SUPPORT_RECORDS.map(record => ({
      assetId: `meaning:${record.wordId}`, kind: "meaning_support", ownerId: record.wordId,
      text: `${record.childDefinition} ${record.ellSupport.oralBridge} ${record.actionPrompt}`,
      path: `/audio/quest-v2/meaning/${record.wordId}.mp3`
    }))
  ].sort((a, b) => a.assetId.localeCompare(b.assetId));
  const source = parseSource();
  assert.deepEqual(source.assets.map(asset => asset.assetId), expected.map(asset => asset.assetId));
  assert.equal(source.assets.length, 80 + MEANING_SUPPORT_RECORDS.length);
  for (let index = 0; index < expected.length; index += 1) {
    const want = expected[index];
    const asset = source.assets[index];
    assert.deepEqual({ assetId: asset.assetId, kind: asset.kind, ownerId: asset.ownerId,
      text: asset.text, path: asset.path }, want);
    assert.deepEqual({ codec: asset.codec, sampleRateHz: asset.sampleRateHz,
      channels: asset.channels, bitrateBps: asset.bitrateBps }, {
      codec: "mp3", sampleRateHz: 44100, channels: 1, bitrateBps: 128000
    });
    assert.equal(asset.voice, "en-US-Chirp3-HD-Leda");
    assert.equal(asset.locale, "en-US");
    assert.equal(asset.humanListeningApproved, false);
    assert.equal(asset.humanListeningReview, null);
    const file = `public${asset.path}`;
    assert.equal(lstatSync(file).isSymbolicLink(), false);
    const bytes = readFileSync(file);
    assert.equal(asset.byteLength, bytes.length);
    assert.equal(asset.sha256, createHash("sha256").update(bytes).digest("hex"));
    assert.equal(asset.textSha256, createHash("sha256").update(asset.text, "utf8").digest("hex"));
    assert.equal(asset.durationSeconds > 0, true);
    assert.equal(Number.isFinite(asset.meanVolumeDb), true);
    assert.equal(Number.isFinite(asset.peakDb), true);
  }
});

test("offline checker validates the exact fixed roots", () => {
  const result = spawnSync(process.execPath, ["tools/checkSoundSeekersSceneAudio.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /mechanical/u);
  assert.match(result.stdout, /listening/u);
});

test("shared manifest generation changes only general and quest outputs", () => {
  const root = mkdtempSync(join(tmpdir(), "sound-seekers-audio-manifest-"));
  const outputs = [
    "audioFilePaths.generated.js", "audioChoiceKeys.generated.js",
    "audioPhonemePaths.generated.js", "audioGuidedReadingPaths.generated.js",
    "audioQuestPaths.generated.js"
  ];
  try {
    mkdirSync(join(root, "tools"), { recursive: true });
    mkdirSync(join(root, "src/data/generated"), { recursive: true });
    mkdirSync(join(root, "public/audio/choices"), { recursive: true });
    mkdirSync(join(root, "public/audio/phonemes"), { recursive: true });
    mkdirSync(join(root, "public/audio/production/en-US/guided_page"), { recursive: true });
    mkdirSync(join(root, "public/audio/quest-v2/instructions"), { recursive: true });
    copyFileSync("tools/generateAudioManifest.js", join(root, "tools/generateAudioManifest.js"));
    writeFileSync(join(root, "package.json"), "{\"type\":\"module\"}\n");
    writeFileSync(join(root, "public/audio/choices/1234567890abcdef.mp3"), "choice");
    writeFileSync(join(root, "public/audio/phonemes/a.mp3"), "phoneme");
    writeFileSync(join(root, "public/audio/production/en-US/guided_page/a.mp3"), "page");
    writeFileSync(join(root, "public/audio/quest-v2/instructions/a.mp3"), "instruction");
    let result = spawnSync(process.execPath, [join(root, "tools/generateAudioManifest.js")], {
      cwd: root, encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const before = Object.fromEntries(outputs.map(name => [name,
      createHash("sha256").update(readFileSync(join(root, "src/data/generated", name))).digest("hex")
    ]));
    mkdirSync(join(root, "public/audio/quest-v2/scenes"), { recursive: true });
    mkdirSync(join(root, "public/audio/quest-v2/meaning"), { recursive: true });
    writeFileSync(join(root, "public/audio/quest-v2/scenes/scene-s1-text.mp3"), "scene");
    writeFileSync(join(root, "public/audio/quest-v2/meaning/mat.mp3"), "meaning");
    result = spawnSync(process.execPath, [join(root, "tools/generateAudioManifest.js")], {
      cwd: root, encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const changed = outputs.filter(name => before[name] !== createHash("sha256")
      .update(readFileSync(join(root, "src/data/generated", name))).digest("hex"));
    assert.deepEqual(changed, ["audioFilePaths.generated.js", "audioQuestPaths.generated.js"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
