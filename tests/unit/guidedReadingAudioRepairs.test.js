import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { resolveReviewedGuidedReadingAudioRepair } from "../../tools/guidedReadingAudioRepairLib.mjs";
import { GUIDED_READING_AUDIO_REPAIRS } from "../../tools/guidedReadingAudioRepairRegistry.mjs";
import { getGuidedReadingWordProductionAudioPath } from "../../src/utils/guidedReading/readAloudPolicy.js";

const voice = "en-US-Chirp3-HD-Leda";
const record = { role: "isolated_word", lookupText: "stood", spokenText: "Stood." };
const sha256 = value => createHash("sha256").update(value).digest("hex");

test("the reviewed published repair resolves to its exact content-addressed bytes and survives generation", () => {
  const repair = GUIDED_READING_AUDIO_REPAIRS["isolated_word:stood"];
  const resolved = resolveReviewedGuidedReadingAudioRepair(record, voice, process.cwd());
  assert.equal(resolved, repair.audioPath);
  assert.equal(getGuidedReadingWordProductionAudioPath("stood"), resolved);
  assert.equal(sha256(readFileSync(path.join("public", resolved))), repair.audioSha256);
  const map = "src/data/generated/guidedReadingLedaGaps.generated.js";
  const before = readFileSync(map, "utf8");
  const inventory = JSON.parse(execFileSync(process.execPath, ["tools/generateGuidedReadingLedaGaps.mjs", "--dry-run", "--book-prefix", "bright-ideas-14"], { encoding: "utf8" }));
  assert.equal(inventory.preflightPassed, true);
  assert.equal(inventory.wordGenerationInventory.find(row => row.normalizedLookupText === "stood").publicPath, resolved);
  assert.equal(readFileSync(map, "utf8"), before);
});

test("repair aliases reject changed role, lookup, voice, spoken text, file bytes and missing files", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "guided-audio-repair-contract-"));
  const bytes = Buffer.from("fixture reviewed bytes");
  const hash = sha256(bytes);
  const audioPath = `/audio/production/en-US/isolated_word/stood-${hash.slice(0, 10)}.mp3`;
  const file = path.join(directory, "public", audioPath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  const entry = { ...GUIDED_READING_AUDIO_REPAIRS["isolated_word:stood"], audioPath, audioSha256: hash };
  const registry = entry => ({ "isolated_word:stood": entry });
  try {
    assert.equal(resolveReviewedGuidedReadingAudioRepair(record, voice, directory, registry(entry)), audioPath);
    for (const [change, message] of [
      [{ role: "guided_page" }, /role or lookup key mismatch/u],
      [{ normalizedLookupText: "stand" }, /role or lookup key mismatch/u],
      [{ voiceName: "other-voice" }, /voice mismatch/u],
      [{ spokenText: "Good." }, /exact spoken text mismatch/u],
      [{ audioPath: "/audio/production/en-US/isolated_word/../stood.mp3" }, /invalid content-addressed audio path/u]
    ]) assert.throws(() => resolveReviewedGuidedReadingAudioRepair(record, voice, directory, registry({ ...entry, ...change })), message);
    assert.equal(resolveReviewedGuidedReadingAudioRepair({ ...record, lookupText: "other" }, voice, directory, registry(entry)), null);
    writeFileSync(file, "changed");
    assert.throws(() => resolveReviewedGuidedReadingAudioRepair(record, voice, directory, registry(entry)), /file hash mismatch/u);
    rmSync(file);
    assert.throws(() => resolveReviewedGuidedReadingAudioRepair(record, voice, directory, registry(entry)), /file is missing/u);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
