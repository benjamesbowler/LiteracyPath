import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { approvedPhonicsPatternAudio } from "../../src/data/approvedPhonicsPatternAudio.js";
import { APPROVED_PHONEME_AUDIO_BY_KEY } from "../../src/data/approvedPhonemeAudio.js";
import { AUDIO_FILE_PATHS } from "../../src/data/generated/audioFilePaths.generated.js";
import {
  DEFERRED_ATOMIC_SOUND_KEYS,
  getPreferredPhonemeAudioPath,
  phonemeAudioCandidates
} from "../../src/data/phonemeAudioBank.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("approved atomic sounds use the single reviewed runtime bank", () => {
  for (const sound of ["a", "i", "o", "u", "c", "d", "f", "g", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z", "ck", "ff", "ll", "ng", "qu", "ss", "wh"]) {
    const resolved = getPreferredPhonemeAudioPath(sound);
    assert.match(resolved, /^\/audio\/(?:phonemes|production\/en-US\/pattern)\//);
    assert.ok(AUDIO_FILE_PATHS.has(resolved), `${sound} resolved to missing ${resolved}`);
  }
});

test("every human-ear approved cue is present in the runtime manifest", async () => {
  assert.deepEqual(DEFERRED_ATOMIC_SOUND_KEYS, []);
  for (const [sound, audioPath] of Object.entries(APPROVED_PHONEME_AUDIO_BY_KEY)) {
    assert.deepEqual(phonemeAudioCandidates(sound), [audioPath]);
    assert.equal(getPreferredPhonemeAudioPath(sound), audioPath);
    assert.ok(AUDIO_FILE_PATHS.has(audioPath), `${sound} is absent from the generated audio manifest`);
    await access(path.join(repositoryRoot, "public", audioPath.replace(/^\//, "")));
  }
});

test("the superseded clean-human grapheme tree is physically deleted", async () => {
  const legacyRoot = path.join(repositoryRoot, "public/audio/child-mode/clean-human/graphemes");
  await assert.rejects(access(legacyRoot));
  const generatedManifest = await readFile(
    path.join(repositoryRoot, "src/data/generated/audioFilePaths.generated.js"),
    "utf8"
  );
  assert.doesNotMatch(generatedManifest, /\/clean-human\/graphemes\//);
});

test("every production pattern file is explicitly approved", async () => {
  const productionRoot = path.join(repositoryRoot, "public/audio/production/en-US/pattern");
  const files = (await readdir(productionRoot)).filter(file => file.endsWith(".mp3")).sort();
  const approvedFiles = approvedPhonicsPatternAudio
    .map(item => path.basename(item.audioPath))
    .sort();
  assert.deepEqual(files, approvedFiles);
});

test("all runtime sound surfaces route through the reviewed bank", async () => {
  const directImports = [
    "src/components/AppPages.jsx",
    "src/components/elQuest/elQuestEngine.js",
    "src/data/audioPreferenceManifest.js",
    "src/data/cvcWordFamilies.js",
    "src/data/phonicsLessons.js",
    "src/utils/learnGamesAudio.js",
    "src/utils/questAudio.js"
  ];
  for (const relativePath of directImports) {
    const source = await readFile(path.join(repositoryRoot, relativePath), "utf8");
    assert.match(source, /phonemeAudioBank/, `${relativePath} bypasses the reviewed bank`);
    assert.doesNotMatch(
      source,
      /\/audio\/(?:child-mode|student-mode)\/clean-human\/graphemes\//,
      `${relativePath} can revive a deleted legacy grapheme path`
    );
  }
});
