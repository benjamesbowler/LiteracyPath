import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { isTempOrSourcePath, isLosslessWebpReplacement } from "../../tools/checkMediaOverwriteRisk.js";

test("ordinary speech words containing temp are not temporary media", () => {
  for (const filePath of [
    "public/audio/production/en-US/isolated_word/learning-from-a-mistake-can-improve-your-next-attempt-c19b9904e7.mp3",
    "public/audio/production/en-US/isolated_word/the-first-attempt-shows-all-you-can-ever-do-9479733527.mp3",
    "public/audio/production/en-US/assessment_passage/the-temperature-went-up-123.mp3",
    "public/images/assessment/contemporary-building.webp"
  ]) assert.equal(isTempOrSourcePath(filePath), false, filePath);
});

test("canonical speech can say preference and source without becoming source material", () => {
  for (const filePath of [
    "public/audio/production/en-US/assessment_prompt/an-opinion-tells-a-judgement-or-preference-a-fact-can-be-checked-c2b988121a.mp3",
    "public/audio/production/en-US/assessment_prompt/give-the-reader-the-needed-facts-a-preference-or-fantasy-is-different-fe936db829.mp3",
    "public/audio/production/en-US/assessment_prompt/choose-a-factual-source-about-the-question-s-topic-3ed1aa470c.mp3",
    "public/audio/production/en-US/assessment_prompt/which-source-would-help-answer-the-question-6a1137aecd.mp3"
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
    "public/media/temp files/clip.mp3",
    "public/audio/production/en-US/assessment_prompt/tmp-source-6a1137aecd.mp3"
  ]) assert.equal(isTempOrSourcePath(filePath), true, filePath);
});

test("existing source-file protections remain intact", () => {
  for (const filePath of [
    "public/images/cat.psd",
    "public/images/cat.png",
    "public/media/manifest.json~",
    "public/images/plan.md",
    "public/images/character-reference.webp",
    "public/images/scene-source.webp",
    "public/images/source-art/scene.webp",
    "public/images/references/character.webp",
    "public/audio/production/en-US/assessment_prompt/source-recording.mp3",
    "public/audio/production/en-US/source/which-source-6a1137aecd.mp3",
    "public/audio/production/en-US/assessment_prompt/source/which-source-6a1137aecd.mp3"
  ]) assert.equal(isTempOrSourcePath(filePath), true, filePath);
});

test("only an unreferenced pixel-identical WebP can replace source packaging", async () => {
  const before = await sharp({ create: { width: 4, height: 3, channels: 4, background: '#3d5bc7' } }).png().toBuffer();
  const same = await sharp(before).webp({ lossless: true }).toBuffer();
  const changed = await sharp(before).resize(2, 2).webp({ lossless: true }).toBuffer();
  assert.equal(await isLosslessWebpReplacement(before, same), true);
  assert.equal(await isLosslessWebpReplacement(before, before), false);
  assert.equal(await isLosslessWebpReplacement(before, same, { referenced: true }), false);
  assert.equal(await isLosslessWebpReplacement(before, changed), false);
  assert.equal(await isLosslessWebpReplacement(before, null), false);
  assert.equal(await isLosslessWebpReplacement(before, Buffer.from('broken')), false);
});
