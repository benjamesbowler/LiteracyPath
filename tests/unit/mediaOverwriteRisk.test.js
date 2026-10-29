import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import sharp from "sharp";
import { isTempOrSourcePath, isLosslessWebpReplacement, isSupersededCardCoverVariant } from "../../tools/checkMediaOverwriteRisk.js";

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

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const canonicalUrl = "/guided-reading/series/test-book/cover.webp";
const renditionUrl = bytes => `/guided-reading/card-covers/${hash(bytes).slice(0, 24)}.webp`;

async function supersededCoverFixture() {
  const previousBytes = await sharp({ create: { width: 4, height: 3, channels: 3, background: "#2563eb" } }).webp().toBuffer();
  const canonical = await sharp({ create: { width: 8, height: 6, channels: 3, background: "#ea580c" } }).webp().toBuffer();
  const delivery = await sharp(canonical).resize(4, 3).webp().toBuffer();
  const oldUrl = renditionUrl(previousBytes), newUrl = renditionUrl(delivery);
  return {
    deletedPath: `public${oldUrl}`,
    previousManifest: { [canonicalUrl]: { src: oldUrl, deliverySha256: hash(previousBytes) } },
    currentManifest: { [canonicalUrl]: {
      src: newUrl, deliverySha256: hash(delivery), sourceSha256: hash(canonical),
      sourceWidth: 8, sourceHeight: 6, width: 4, height: 3, bytes: delivery.length
    } },
    previousBytes,
    currentFiles: { [canonicalUrl]: canonical, [newUrl]: delivery }
  };
}

function changeDelivery(fixture, bytes, { width = 4, height = 3 } = {}) {
  const current = fixture.currentManifest[canonicalUrl];
  delete fixture.currentFiles[current.src];
  Object.assign(current, { src: renditionUrl(bytes), deliverySha256: hash(bytes), bytes: bytes.length, width, height });
  fixture.currentFiles[current.src] = bytes;
}

test("a superseded card-cover delivery needs both manifests and verified retained source and replacement bytes", async () => {
  assert.equal(await isSupersededCardCoverVariant(await supersededCoverFixture()), true);
});

for (const [label, mutate] of [
  ["canonical artwork deletion", f => { f.deletedPath = `public${canonicalUrl}`; }],
  ["arbitrary media deletion", f => { f.deletedPath = f.deletedPath.replace("/guided-reading/card-covers/", "/images/"); }],
  ["non-content-addressed card-cover deletion", f => { f.deletedPath = "public/guided-reading/card-covers/cover.webp"; }],
  ["missing prior mapping", f => { f.previousManifest = {}; }],
  ["missing current canonical mapping", f => { f.currentManifest = {}; }],
  ["active current-manifest URL", f => { f.currentManifest["/guided-reading/another/cover.webp"] = { src: f.deletedPath.slice(6) }; }],
  ["active source/preview/demo reference", f => { f.referenced = true; }],
  ["missing old HEAD bytes", f => { f.previousBytes = null; }],
  ["old HEAD bytes mismatch", f => { f.previousBytes = Buffer.from("different old bytes"); }],
  ["prior delivery hash mismatch", f => { f.previousManifest[canonicalUrl].deliverySha256 = "0".repeat(64); }],
  ["old filename hash mismatch", f => {
    const oldUrl = `/guided-reading/card-covers/${"a".repeat(24)}.webp`;
    f.previousManifest[canonicalUrl].src = oldUrl; f.deletedPath = `public${oldUrl}`;
  }],
  ["current delivery hash mismatch", f => { f.currentManifest[canonicalUrl].deliverySha256 = "0".repeat(64); }],
  ["replacement filename hash mismatch", f => {
    const current = f.currentManifest[canonicalUrl], bytes = f.currentFiles[current.src];
    current.src = `/guided-reading/card-covers/${"a".repeat(24)}.webp`; f.currentFiles[current.src] = bytes;
  }],
  ["replacement outside the card-cover directory", f => {
    const current = f.currentManifest[canonicalUrl], bytes = f.currentFiles[current.src];
    current.src = "/guided-reading/series/another/cover.webp"; f.currentFiles[current.src] = bytes;
  }],
  ["replacement bytes mismatch", f => { f.currentFiles[f.currentManifest[canonicalUrl].src] = f.previousBytes; }],
  ["canonical source hash mismatch", f => { f.currentManifest[canonicalUrl].sourceSha256 = "0".repeat(64); }],
  ["missing canonical source", f => { delete f.currentFiles[canonicalUrl]; }],
  ["missing replacement", f => { delete f.currentFiles[f.currentManifest[canonicalUrl].src]; }],
  ["replacement byte length mismatch", f => { f.currentManifest[canonicalUrl].bytes += 1; }],
  ["replacement width mismatch", f => { f.currentManifest[canonicalUrl].width += 1; }],
  ["canonical source dimensions mismatch", f => { f.currentManifest[canonicalUrl].sourceWidth += 1; }],
  ["a delivery variant posing as canonical artwork", f => {
    const fakeSource = `/guided-reading/card-covers/${"f".repeat(24)}.webp`;
    f.previousManifest[fakeSource] = f.previousManifest[canonicalUrl]; delete f.previousManifest[canonicalUrl];
    f.currentManifest[fakeSource] = f.currentManifest[canonicalUrl]; delete f.currentManifest[canonicalUrl];
    f.currentFiles[fakeSource] = f.currentFiles[canonicalUrl];
  }],
  ["a traversal path posing as canonical artwork", f => {
    const fakeSource = "/guided-reading/../images/cover.webp";
    f.previousManifest[fakeSource] = f.previousManifest[canonicalUrl]; delete f.previousManifest[canonicalUrl];
    f.currentManifest[fakeSource] = f.currentManifest[canonicalUrl]; delete f.currentManifest[canonicalUrl];
    f.currentFiles[fakeSource] = f.currentFiles[canonicalUrl];
  }]
]) {
  test(`superseded card-cover proof rejects ${label}`, async () => {
    const fixture = await supersededCoverFixture();
    mutate(fixture);
    assert.equal(await isSupersededCardCoverVariant(fixture), false);
  });
}

test("a replacement must decode as WebP and remain within the 512px delivery limit", async () => {
  for (const kind of ["png", "oversized", "corrupt"]) {
    const fixture = await supersededCoverFixture();
    const delivery = kind === "corrupt"
      ? Buffer.from("RIFF invalid WEBP data")
      : await sharp(fixture.currentFiles[canonicalUrl]).resize(kind === "oversized" ? 513 : 4, 3)[kind === "png" ? "png" : "webp"]().toBuffer();
    changeDelivery(fixture, delivery, { width: kind === "oversized" ? 513 : 4 });
    assert.equal(await isSupersededCardCoverVariant(fixture), false, kind);
  }
});

test("every prior canonical mapping for a shared old rendition must have a verified replacement", async () => {
  const fixture = await supersededCoverFixture();
  fixture.previousManifest["/guided-reading/another/cover.webp"] = fixture.previousManifest[canonicalUrl];
  assert.equal(await isSupersededCardCoverVariant(fixture), false);
});
