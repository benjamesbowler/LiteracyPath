import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import test from "node:test";
import sharp from "sharp";
import { isTempOrSourcePath, isLosslessWebpReplacement, isSupersededCardCoverVariant, isVerifiedBookRetirement, selectMediaBaseline, isVerifiedNarrationSupersession, isAudioEnumerationOnlyReference, isDecodableNarrationAudio } from "../../tools/checkMediaOverwriteRisk.js";

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

test("pending merges compare against the incoming tree; ordinary work compares against HEAD", () => {
  const incoming = "a".repeat(40);
  assert.equal(selectMediaBaseline(ref => { assert.equal(ref, "MERGE_HEAD"); return incoming; }), incoming);
  assert.equal(selectMediaBaseline(() => { throw new Error("no merge in progress"); }), "HEAD");
  assert.throws(() => selectMediaBaseline(() => `${incoming}\n${"b".repeat(40)}`), /one incoming merge commit/);
});

async function retirementFixture() {
  const previous = await sharp({ create: { width: 8, height: 6, channels: 3, background: "#2563eb" } }).webp().toBuffer();
  const current = await sharp({ create: { width: 8, height: 6, channels: 3, background: "#ea580c" } }).webp().toBuffer();
  const revision = "a".repeat(40), oldPrefix = "/guided-reading/old-book/", newPrefix = "/guided-reading/new-book/";
  const assets = Array.from({ length: 9 }, (_, page) => {
    const name = page ? `page-${String(page).padStart(2, "0")}.webp` : "cover.webp";
    return { page, oldPath: oldPrefix + name, newPath: newPrefix + name, oldSha256: { [revision]: hash(previous) }, newSha256: hash(current) };
  });
  return {
    retirement: { oldBookId: "old-book", newBookId: "new-book", oldAssetPrefix: oldPrefix, newAssetPrefix: newPrefix, assetCount: 9, sourceRevisions: [revision], assets },
    previousFiles: Object.fromEntries(assets.map(a => [a.oldPath, previous])),
    historicalFiles: Object.fromEntries(assets.map(a => [`${revision}:${a.oldPath}`, previous])),
    currentFiles: Object.fromEntries(assets.map(a => [a.newPath, current])),
    previousAssetPaths: assets.map(a => a.oldPath), currentAssetPaths: assets.map(a => a.newPath),
    runtimeBooks: [{ id: "new-book", coverImage: assets[0].newPath, pages: assets.slice(1).map(a => ({ pageNumber: a.page, image: a.newPath })) }],
    approvedAssets: assets.map(a => ({ path: a.newPath, status: "approved", sha256: hash(current) }))
  };
}

test("a complete nine-image retirement verifies exact page bindings and every historical/current byte", async () => {
  assert.equal(await isVerifiedBookRetirement(await retirementFixture()), true);
});

for (const [label, mutate] of [
  ["unchanged stable identity", f => { f.retirement.newBookId = f.retirement.oldBookId; }],
  ["partial registry", f => { f.retirement.assets.pop(); }],
  ["unlisted old asset", f => { f.previousAssetPaths.push("/guided-reading/old-book/page-09.webp"); }],
  ["unlisted new file", f => { f.currentAssetPaths.push("/guided-reading/new-book/page-09.webp"); }],
  ["duplicated page binding", f => { f.retirement.assets[8].page = 7; }],
  ["swapped page binding", f => { [f.retirement.assets[7].page, f.retirement.assets[8].page] = [8, 7]; }],
  ["traversal path", f => { f.retirement.assets[8].newPath = "/guided-reading/new-book/../other.webp"; }],
  ["wrong old bytes", f => { f.previousFiles[f.retirement.assets[8].oldPath] = Buffer.from("different"); }],
  ["invented source lineage", f => { f.historicalFiles[Object.keys(f.historicalFiles)[8]] = Buffer.from("different"); }],
  ["missing source lineage", f => { f.retirement.sourceRevisions = []; }],
  ["missing historical source bytes", f => { delete f.historicalFiles[Object.keys(f.historicalFiles)[8]]; }],
  ["wrong approved new SHA", f => { f.approvedAssets[8].sha256 = "0".repeat(64); }],
  ["quarantined new artwork", f => { f.approvedAssets[8].status = "hold"; }],
  ["missing artwork review", f => { f.approvedAssets.pop(); }],
  ["ambiguous duplicate review", f => { f.approvedAssets.push(f.approvedAssets[8]); }],
  ["missing new bytes", f => { delete f.currentFiles[f.retirement.assets[8].newPath]; }],
  ["new byte hash mismatch", f => { f.retirement.assets[8].newSha256 = "0".repeat(64); }],
  ["new book absent from runtime", f => { f.runtimeBooks = []; }],
  ["old book still in runtime", f => { f.runtimeBooks.push({ id: "old-book" }); }],
  ["old path still bound by another book", f => { f.runtimeBooks.push({ id: "other", coverImage: f.retirement.assets[0].oldPath }); }],
  ["missing runtime page", f => { f.runtimeBooks[0].pages.pop(); }],
  ["wrong runtime page number", f => { f.runtimeBooks[0].pages[7].pageNumber = 7; }],
  ["old raw-source ID/path reference", f => { f.referenced = true; }],
  ["old canonical files still present", f => { f.oldFilesPresent = true; }]
]) {
  test(`whole-book retirement rejects ${label}`, async () => {
    const fixture = await retirementFixture(); mutate(fixture);
    assert.equal(await isVerifiedBookRetirement(fixture), false);
  });
}

test("even matching review and registry hashes cannot approve corrupt or non-WebP new artwork", async () => {
  for (const kind of ["corrupt", "png"]) {
    const fixture = await retirementFixture(), asset = fixture.retirement.assets[8];
    const bytes = kind === "corrupt" ? Buffer.from("RIFF invalid WEBP data") : await sharp(fixture.currentFiles[asset.newPath]).png().toBuffer();
    fixture.currentFiles[asset.newPath] = bytes;
    asset.newSha256 = fixture.approvedAssets[8].sha256 = hash(bytes);
    assert.equal(await isVerifiedBookRetirement(fixture), false, kind);
  }
});

test("retired cover sources need an explicit verified old-to-new binding", async () => {
  const fixture = await supersededCoverFixture(), newSource = "/guided-reading/new-book/cover.webp";
  fixture.currentManifest[newSource] = fixture.currentManifest[canonicalUrl]; delete fixture.currentManifest[canonicalUrl];
  fixture.currentFiles[newSource] = fixture.currentFiles[canonicalUrl]; delete fixture.currentFiles[canonicalUrl];
  assert.equal(await isSupersededCardCoverVariant(fixture), false);
  fixture.previousManifest[canonicalUrl].sourceSha256 = "a".repeat(64);
  fixture.retiredSourceBindings = { [canonicalUrl]: { newPath: newSource, oldSha256: "a".repeat(64), newSha256: fixture.currentManifest[newSource].sourceSha256 } };
  assert.equal(await isSupersededCardCoverVariant(fixture), true);
  fixture.retiredSourceBindings[canonicalUrl].oldSha256 = "b".repeat(64);
  assert.equal(await isSupersededCardCoverVariant(fixture), false);
  fixture.retiredSourceBindings[canonicalUrl].oldSha256 = "a".repeat(64);
  fixture.currentManifest[newSource].sourceSha256 = "0".repeat(64);
  assert.equal(await isSupersededCardCoverVariant(fixture), false);
});

const narrationBytes = () => execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.15", "-f", "mp3", "pipe:1"], { stdio: ["ignore", "pipe", "pipe"] });

function narrationFixture() {
  const previousBytes = Buffer.from("historical recorded narration"), currentBytes = narrationBytes();
  const revision = "a".repeat(40), voice = "en-US-Chirp3-HD-Leda";
  const oldAudioPath = "/audio/production/en-US/guided_page/old-page-1234567890.mp3";
  const newAudioPath = "/audio/production/en-US/guided_page/new-page-abcdef0123.mp3";
  const oldText = "The old story ended here.", newText = "The friends sit at the table.";
  const oldBookId = "old-book", newBookId = "new-book";
  return {
    retirement: { oldBookId, oldPageNumber: 1, oldText, oldAudioPath, newBookId, newPageNumber: 1,
      newText, newAudioPath, newSha256: hash(currentBytes), sourceRevisions: [revision], oldSha256: { [revision]: hash(previousBytes) }, voice },
    previousBytes, currentOldBytes: previousBytes, currentBytes,
    historicalEvidence: [{ revision, bookId: oldBookId, pageNumber: 1, bytes: previousBytes, displayedText: oldText, audioPath: oldAudioPath, voice }],
    currentPages: [{ bookId: newBookId, pageNumber: 1, displayedText: newText, audioPath: newAudioPath, audioSha256: hash(currentBytes),
      audioExists: true, pageAudioTextMatches: true, transcriptMatches: true, exactLedaAudioResolves: true }],
    runtimeBooks: [{ id: newBookId, pages: [{ pageNumber: 1, text: newText, pageAudioText: newText }] }],
    clearance: { [newBookId + "::1"]: { displayedText: newText, voice } }, provenancePassed: true
  };
}

test("an exact narration supersession validates before and after deleting the unused old clip", () => {
  const f = narrationFixture();
  assert.equal(isVerifiedNarrationSupersession(f), true);
  delete f.currentOldBytes;
  assert.equal(isVerifiedNarrationSupersession(f), true);
});

test("an opening-line revision may keep the same stable book identity", () => {
  const f = narrationFixture();
  f.retirement.newBookId = f.retirement.oldBookId;
  f.runtimeBooks[0].id = f.currentPages[0].bookId = f.retirement.oldBookId;
  f.clearance["old-book::1"] = f.clearance["new-book::1"]; delete f.clearance["new-book::1"];
  assert.equal(isVerifiedNarrationSupersession(f), true);
});

for (const [label, mutate] of [
  ["unregistered audio role", f => { f.retirement.oldAudioPath = f.retirement.oldAudioPath.replace("guided_page", "isolated_word"); }],
  ["same old and new clip", f => { f.retirement.newAudioPath = f.retirement.oldAudioPath; }],
  ["invented old book identity", f => { f.retirement.oldBookId = "another-book"; }],
  ["wrong old page", f => { f.retirement.oldPageNumber = 2; }],
  ["wrong historical text", f => { f.historicalEvidence[0].displayedText = "Another old line."; }],
  ["wrong historical mapping", f => { f.historicalEvidence[0].audioPath = f.retirement.newAudioPath; }],
  ["wrong historical SHA", f => { f.historicalEvidence[0].bytes = Buffer.from("other historical bytes"); }],
  ["unverified current old bytes", f => { f.currentOldBytes = Buffer.from("other existing bytes"); }],
  ["missing lineage", f => { f.historicalEvidence = []; }],
  ["stale provenance snapshot", f => { f.provenancePassed = false; }],
  ["remaining required old page cue", f => { f.currentPages.push({ displayedText: f.retirement.oldText, audioPath: f.retirement.oldAudioPath }); }],
  ["old text still required with another clip", f => { f.currentPages.push({ displayedText: f.retirement.oldText, audioPath: "/another.mp3" }); }],
  ["remaining old text mapping", f => { f.oldTextResolutionPath = f.retirement.oldAudioPath; }],
  ["remaining source binding", f => { f.meaningfulReferences = ["src/someCue.js"]; }],
  ["old book still live", f => { f.runtimeBooks.push({ id: "old-book", pages: [] }); }],
  ["missing new runtime page", f => { f.runtimeBooks[0].pages = []; }],
  ["wrong current displayed text", f => { f.runtimeBooks[0].pages[0].text = "A different line."; }],
  ["wrong current pageAudioText", f => { f.runtimeBooks[0].pages[0].pageAudioText = "A different line."; }],
  ["wrong replacement SHA", f => { f.retirement.newSha256 = "0".repeat(64); }],
  ["wrong current resolved audio path", f => { f.currentPages[0].audioPath = "/another.mp3"; }],
  ["wrong current resolved audio SHA", f => { f.currentPages[0].audioSha256 = "0".repeat(64); }],
  ["failed exact-text resolution", f => { f.currentPages[0].exactLedaAudioResolves = false; }],
  ["unreviewed current text", f => { f.clearance = {}; }],
  ["wrong narration voice", f => { f.retirement.voice = "other-voice"; }]
]) {
  test(`narration supersession rejects ${label}`, () => {
    const f = narrationFixture(); mutate(f);
    assert.equal(isVerifiedNarrationSupersession(f), false);
  });
}

test("audio headers and matching SHA metadata cannot replace a complete MP3 decode", () => {
  const f = narrationFixture();
  f.currentBytes = Buffer.from("ID3 corrupt audio");
  f.retirement.newSha256 = f.currentPages[0].audioSha256 = hash(f.currentBytes);
  assert.equal(isVerifiedNarrationSupersession(f), false);
  assert.equal(isDecodableNarrationAudio(null), false);
  const wav = execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.15", "-f", "wav", "pipe:1"], { stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(isDecodableNarrationAudio(wav), false);
});

test("only generated filename enumeration data may retain an obsolete audio basename", () => {
  const audioPath = "/audio/production/en-US/guided_page/old-page-1234567890.mp3";
  const f = { referencePath: "src/data/generated/audioFilePaths.generated.js", audioPath,
    source: '// AUTO-GENERATED by tools/generateAudioManifest.js - do not edit.\nconst inventory = Object.entries({"/audio/production/en-US/guided_page":"old-page-1234567890.mp3"});\n' };
  assert.equal(isAudioEnumerationOnlyReference(f), true);
  assert.equal(isAudioEnumerationOnlyReference({ ...f, referencePath: "src/data/generated/anotherAudio.generated.js" }), false);
  assert.equal(isAudioEnumerationOnlyReference({ ...f, source: f.source + `const cue = "${audioPath}";` }), false);
  assert.equal(isAudioEnumerationOnlyReference({ ...f, source: f.source.replace('"/audio/production/en-US/guided_page"', '"/audio/other"') }), false);
  assert.equal(isAudioEnumerationOnlyReference({ ...f, source: f.source.replace("AUTO-GENERATED", "MANUALLY-AUTHORED") }), false);
});
