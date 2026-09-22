import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import { withRepairedGuidedReadingImageVersion as version } from "../../src/utils/guidedReading/mediaVersion.js";
import { GUIDED_READING_IMAGE_REVISIONS as revisions } from "../../src/data/generated/guidedReadingImageRevisions.generated.js";
import { mergeWillowImageRevisions } from "../../tools/guidedReadingImageRevisionsLib.mjs";

test("repaired reader images request current bytes without changing canonical paths", () => {
  for (const [path, hash] of Object.entries(revisions)) {
    const bytes = fs.readFileSync(new URL("../../public" + path, import.meta.url));
    assert.equal(hash, createHash("sha256").update(bytes).digest("hex").slice(0, 12));
    const src = version(path + "?mode=reader&v=old#page");
    assert.equal(src, path + "?mode=reader&v=" + hash + "#page");
    assert.equal(version(src, "legacy"), src);
  }
  assert.equal(version("/guided-reading/unrelated.webp"), "/guided-reading/unrelated.webp");
  assert.equal(version("/images/other.webp", "legacy"), "/images/other.webp");
  assert.equal(version(""), "");
  assert.equal(version("/guided-reading/unrelated.webp", "legacy"), "/guided-reading/unrelated.webp?v=legacy");
});

test("reviewed replacements at existing image paths have matching cache revisions", () => {
  const audit = JSON.parse(fs.readFileSync(new URL(
    "../../docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json", import.meta.url
  )));
  const replacements = audit.pages.filter(page => {
    const prior = page.editorialReview20260922?.priorFingerprint;
    return prior?.imagePath === page.imagePath && prior.imageSha256 !== page.imageSha256;
  });
  assert.ok(replacements.length > 0);
  for (const page of replacements) {
    assert.equal(revisions[page.imagePath], page.imageSha256.slice(0, 12), page.imagePath);
  }
});

test("Willow regeneration preserves other collections and replaces only Willow revisions", () => {
  const nonWillow = "/guided-reading/series/meadow-pals/book-04/page-006.webp";
  const willow = "/guided-reading/willow-street/the-squeaky-wheel/page-05.webp";
  const staleWillow = "/guided-reading/willow-street/old.webp";
  const assets = [{ path: willow, sha256: "a".repeat(64), cacheVersion: "a".repeat(12) }];
  assert.deepEqual(mergeWillowImageRevisions({
    [nonWillow]: "preserved", [willow]: "stale", [staleWillow]: "stale"
  }, assets), { [nonWillow]: "preserved", [willow]: "a".repeat(12) });
  assert.throws(() => mergeWillowImageRevisions({}, [{ ...assets[0], cacheVersion: "wrong" }]), /Invalid image cache version/);
});
