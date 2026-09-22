import assert from "node:assert/strict";
import test from "node:test";
import { isTempOrSourcePath } from "../../tools/checkMediaOverwriteRisk.js";

test("ordinary speech words containing temp are not temporary media", () => {
  for (const filePath of [
    "public/audio/production/en-US/isolated_word/learning-from-a-mistake-can-improve-your-next-attempt-c19b9904e7.mp3",
    "public/audio/production/en-US/isolated_word/the-first-attempt-shows-all-you-can-ever-do-9479733527.mp3",
    "public/audio/production/en-US/assessment_passage/the-temperature-went-up-123.mp3",
    "public/images/assessment/contemporary-building.webp"
  ]) assert.equal(isTempOrSourcePath(filePath), false, filePath);
});

test("temporary filenames and staging directories stay blocked", () => {
  for (const filePath of [
    "public/audio/production/story.tmp.wav",
    "public/audio/production/story.tmp.mp3",
    "public/audio/production/story.mp3.tmp",
    "public/images/assessment/temp-crop.webp",
    "public/images/assessment/photo_TMP.webp",
    "public/images/temp/fish.webp",
    "public/media/tmp/clip.mp3",
    "public/media/temp-stage/clip.mp3",
    "public/media/temp files/clip.mp3"
  ]) assert.equal(isTempOrSourcePath(filePath), true, filePath);
});

test("existing source-file protections remain intact", () => {
  for (const filePath of [
    "public/images/cat.psd",
    "public/images/cat.png",
    "public/media/manifest.json~",
    "public/images/plan.md",
    "public/images/character-reference.webp",
    "public/images/scene-source.webp"
  ]) assert.equal(isTempOrSourcePath(filePath), true, filePath);
});
