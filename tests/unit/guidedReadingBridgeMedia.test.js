import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { GUIDED_READING_BRIDGE_BOOKS } from "../../src/data/guidedReadingBridgeBooks.js";

const ROOT = resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = resolve(
  ROOT,
  "docs/guided-reading/willow-street-illustrated-media-manifest.json"
);
const PHOTOREAL_MANIFEST_PATH = resolve(
  ROOT,
  "docs/guided-reading/willow-street-photoreal-media-manifest.json"
);
const sha256 = value => createHash("sha256").update(value).digest("hex");

test("every illustrated bridge page resolves to a unique reviewed-sized asset", async () => {
  const illustrated = GUIDED_READING_BRIDGE_BOOKS.filter(
    book => book.visualTreatment === "willow-street-illustrated"
  );
  assert.equal(illustrated.length, 14);

  const expected = illustrated.flatMap(book => [
    {
      bookId: book.id,
      pageNumber: 0,
      path: book.coverImage,
      text: book.title,
      brief: book.coverBrief
    },
    ...book.pages.map(page => ({
      bookId: book.id,
      pageNumber: page.pageNumber,
      path: page.image,
      text: page.text,
      brief: page.imageBrief
    }))
  ]);

  assert.equal(expected.length, 126);
  assert.equal(new Set(expected.map(item => item.path)).size, expected.length);

  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.collection, "Willow Street Readers");
  assert.equal(manifest.visualTreatment, "willow-street-illustrated");
  assert.equal(manifest.generator.provenance, "self-created");
  assert.equal(manifest.generator.mode, "built-in-image_gen-one-call-per-asset");
  assert.equal(manifest.castReference.directReview.state, "approved-original-detail");
  assert.match(manifest.castReference.sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.assets.length, expected.length);

  const manifestByPath = new Map(manifest.assets.map(asset => [asset.path, asset]));
  assert.equal(manifestByPath.size, expected.length);
  const hashes = new Set();

  for (const item of expected) {
    const absolutePath = resolve(ROOT, "public", item.path.replace(/^\//, ""));
    await access(absolutePath);
    const bytes = await readFile(absolutePath);
    const metadata = await sharp(bytes).metadata();
    const record = manifestByPath.get(item.path);

    assert.ok(record, `manifest record missing: ${item.path}`);
    assert.equal(metadata.format, "webp", item.path);
    assert.equal(metadata.width, 1365, item.path);
    assert.equal(metadata.height, 768, item.path);
    assert.equal(metadata.space, "srgb", item.path);
    assert.equal(record.bookId, item.bookId, item.path);
    assert.equal(record.pageNumber, item.pageNumber, item.path);
    assert.equal(record.sha256, sha256(bytes), item.path);
    assert.equal(record.width, metadata.width, item.path);
    assert.equal(record.height, metadata.height, item.path);
    assert.equal(record.textSha256, sha256(item.text), item.path);
    assert.equal(record.briefSha256, sha256(item.brief), item.path);
    assert.equal(record.visualTreatment, "willow-street-illustrated", item.path);
    assert.equal(record.generatorProvenance, "self-created", item.path);
    assert.equal(record.castReferenceSha256, manifest.castReference.sha256, item.path);
    assert.equal(record.directReview.state, "approved-original-detail", item.path);
    assert.equal(record.directReview.reviewedSha256, record.sha256, item.path);
    assert.ok(record.directReview.notes.length > 0, item.path);
    assert.ok(!hashes.has(record.sha256), `duplicate final pixels: ${item.path}`);
    hashes.add(record.sha256);
  }
});

test("the six nonfiction books use unique self-created photorealistic assets", async () => {
  const nonfiction = GUIDED_READING_BRIDGE_BOOKS.filter(
    book => book.visualTreatment === "self-created-photorealistic"
  );
  assert.equal(nonfiction.length, 6);
  assert.ok(nonfiction.every(book => book.mediaLicense === "self-created"));

  const expected = nonfiction.flatMap(book => [
    {
      bookId: book.id,
      pageNumber: 0,
      path: book.coverImage,
      text: book.title,
      brief: book.coverBrief
    },
    ...book.pages.map(page => ({
      bookId: book.id,
      pageNumber: page.pageNumber,
      path: page.image,
      text: page.text,
      brief: page.imageBrief
    }))
  ]);

  assert.equal(expected.length, 54);
  assert.equal(new Set(expected.map(item => item.path)).size, expected.length);

  const manifest = JSON.parse(await readFile(PHOTOREAL_MANIFEST_PATH, "utf8"));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.collection, "Willow Street Readers");
  assert.equal(manifest.visualTreatment, "self-created-photorealistic");
  assert.equal(manifest.generator.provenance, "self-created");
  assert.equal(manifest.generator.mode, "built-in-image_gen-one-call-per-asset");
  assert.equal(manifest.assets.length, expected.length);

  const manifestByPath = new Map(manifest.assets.map(asset => [asset.path, asset]));
  assert.equal(manifestByPath.size, expected.length);
  const hashes = new Set();

  for (const item of expected) {
    const absolutePath = resolve(ROOT, "public", item.path.replace(/^\//, ""));
    await access(absolutePath);
    const bytes = await readFile(absolutePath);
    const metadata = await sharp(bytes).metadata();
    const record = manifestByPath.get(item.path);

    assert.ok(record, `manifest record missing: ${item.path}`);
    assert.equal(metadata.format, "webp", item.path);
    assert.equal(metadata.width, 1365, item.path);
    assert.equal(metadata.height, 768, item.path);
    assert.equal(metadata.space, "srgb", item.path);
    assert.equal(record.bookId, item.bookId, item.path);
    assert.equal(record.pageNumber, item.pageNumber, item.path);
    assert.equal(record.mediaLicense, "self-created", item.path);
    assert.equal(record.sha256, sha256(bytes), item.path);
    assert.equal(record.width, metadata.width, item.path);
    assert.equal(record.height, metadata.height, item.path);
    assert.equal(record.textSha256, sha256(item.text), item.path);
    assert.equal(record.briefSha256, sha256(item.brief), item.path);
    assert.equal(record.visualTreatment, "self-created-photorealistic", item.path);
    assert.equal(record.generatorProvenance, "self-created", item.path);
    assert.equal(record.directReview.state, "approved-original-detail", item.path);
    assert.equal(record.directReview.reviewedSha256, record.sha256, item.path);
    assert.ok(record.directReview.notes.length > 0, item.path);
    assert.ok(!hashes.has(record.sha256), `duplicate final pixels: ${item.path}`);
    hashes.add(record.sha256);
  }
});
