import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import { withRepairedGuidedReadingImageVersion as version } from "../../src/utils/guidedReading/mediaVersion.js";
import { GUIDED_READING_IMAGE_REVISIONS as revisions } from "../../src/data/generated/guidedReadingImageRevisions.generated.js";

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
