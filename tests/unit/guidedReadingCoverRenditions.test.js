import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { bookCoverSources } from "../../src/policy/childLibraryPolicy.js";
import { bookCoverDeliverySources } from "../../src/utils/guidedReading/coverRenditions.js";
import { withRepairedGuidedReadingImageVersion } from "../../src/utils/guidedReading/mediaVersion.js";
import { GUIDED_READING_COVER_RENDITIONS, GUIDED_READING_COVER_ENCODING } from "../../src/data/generated/guidedReadingCoverRenditions.generated.js";

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const publicFile = source => new URL(`../../public${source}`, import.meta.url);

test("every runtime cover has a decoded, current, bounded rendition of its exact source art", async () => {
  const sources = [...new Set(getRuntimeGuidedReadingBooks().map(book => bookCoverSources(book)[0]).filter(Boolean))].sort();
  assert.deepEqual(Object.keys(GUIDED_READING_COVER_RENDITIONS).sort(), sources);
  assert.equal(GUIDED_READING_COVER_ENCODING.maxEdge, 512);
  for (const source of sources) {
    const entry = GUIDED_READING_COVER_RENDITIONS[source];
    const sourceBytes = await fs.readFile(publicFile(source));
    const delivery = await fs.readFile(publicFile(entry.src));
    assert.equal(digest(sourceBytes), entry.sourceSha256, `${source}: regenerate after source changes`);
    assert.equal(digest(delivery), entry.deliverySha256, source);
    assert.ok(entry.src.includes(entry.deliverySha256.slice(0, 24)), "delivery changes invalidate cached bytes");
    const { info } = await sharp(delivery).raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, entry.width, source);
    assert.equal(info.height, entry.height, source);
    assert.equal(delivery.length, entry.bytes, source);
    assert.ok(Math.max(info.width, info.height) <= 512, source);
    // fit:inside permits rounding by one pixel, never a compositional crop.
    assert.ok(Math.abs(info.width - entry.sourceWidth * info.height / entry.sourceHeight) <= 1, source);
    assert.ok(info.width <= entry.sourceWidth && info.height <= entry.sourceHeight, source);
  }
});

test("card delivery keeps canonical and same-book fallback order after source retirement", () => {
  const book = getRuntimeGuidedReadingBooks().find(item => item.id === "ab-c-09");
  const sources = bookCoverSources(book);
  const delivery = bookCoverDeliverySources(sources);
  assert.equal(delivery[0], GUIDED_READING_COVER_RENDITIONS[sources[0]].src);
  assert.equal(delivery[1], withRepairedGuidedReadingImageVersion(sources[0]));
  assert.equal(delivery[2], withRepairedGuidedReadingImageVersion(sources[1]));
  const retiredSources = bookCoverSources(book, ({ path }) => path === sources[0]);
  const retiredDelivery = bookCoverDeliverySources(retiredSources);
  assert.ok(!retiredDelivery.includes(delivery[0]));
  assert.ok(!retiredDelivery.includes(delivery[1]));
  assert.equal(retiredDelivery[0], withRepairedGuidedReadingImageVersion(sources[1]));
  assert.deepEqual(bookCoverDeliverySources(), []);
  assert.deepEqual(bookCoverDeliverySources(["/new-cover.webp", "/new-cover.webp"]), ["/new-cover.webp"]);
  assert.equal(book.coverImage || book.cover || book.coverUrl, sources[0], "book data and full reader source stay canonical");
});

test("a source repair bypasses an older card rendition until it is rebuilt", () => {
  const source = "/guided-reading/willow-street/build-a-cardboard-ramp/cover.webp";
  const entry = GUIDED_READING_COVER_RENDITIONS[source];
  const canonical = withRepairedGuidedReadingImageVersion(source);
  assert.match(canonical, /\?v=/);
  assert.equal(bookCoverDeliverySources([source])[0], entry.src);
  assert.deepEqual(bookCoverDeliverySources([source], {
    [source]: { ...entry, sourceSha256: "0".repeat(64) }
  }), [canonical]);
  assert.deepEqual(bookCoverDeliverySources([`${source}?v=explicit-update`]), [canonical]);
});
