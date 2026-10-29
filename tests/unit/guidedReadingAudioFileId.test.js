import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { guidedReadingAudioFileId } from "../../tools/guidedReadingAudioPipelineLib.mjs";

test("long page audio names fit filesystem limits and retain full-text identity", () => {
  const voice = "en-US-Chirp3-HD-Leda";
  const common = "This is one example street. ".repeat(30);
  const first = guidedReadingAudioFileId({ role: "guided_page", lookupText: common + "A pipe." }, voice);
  const second = guidedReadingAudioFileId({ role: "guided_page", lookupText: common + "A cable." }, voice);
  assert.ok(Buffer.byteLength(first + ".wav") <= 255);
  assert.notEqual(first, second);
  assert.equal(first.slice(0, -10), second.slice(0, -10));
});

test("ordinary audio names keep their previous stable identity", () => {
  const voice = "en-US-Chirp3-HD-Leda";
  const lookupText = "I get a ball and a tin.";
  const digest = createHash("sha256").update(`${voice}|guided_page|${lookupText}|${lookupText}|standard`).digest("hex").slice(0, 10);
  assert.equal(guidedReadingAudioFileId({ role: "guided_page", lookupText }, voice), `i-get-a-ball-and-a-tin-${digest}`);
});
