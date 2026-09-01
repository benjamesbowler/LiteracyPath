import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import { ASSESSMENT_REJECTED_IMAGE_HASHES } from "../../src/content/assessments/v3/assessmentImageReviewPolicy.js";
import {
  ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES,
  ASSESSMENT_MEDIA_AUDIT_REVIEW_VERSION
} from "../../src/content/assessments/v3/assessmentMediaAuditRejectedHashes.generated.js";
import {
  AUTHORING_DIR,
  expandBank,
  makeImageResolver,
  ROOT
} from "../../tools/assessmentRebuild/lib.mjs";

const imagePaths = item => [...new Set([
  item.imagePath,
  item.imageUrl,
  item.targetImage,
  item.targetImagePath,
  ...(item.imageCards || []).flatMap(card => [card.image, card.imagePath]),
  ...(item.sequenceCards || []).flatMap(card => [card.image, card.imagePath])
].filter(Boolean))];

const CROP_CONTAMINATED_PATH_BY_SHA256 = Object.freeze({
  "01385d7324807f18822331da15fd5f9d94073aa29b5c0c1b8113491042263afc": "/images/assessment/rhyming/variants/am/ham-02.webp",
  "780f5382eb6f3be4bb9c396d9d742891e606ac3e4fadc80734c031c85ef6865c": "/images/assessment/rhyming/variants/am/ram-02.webp",
  "9f4006f08a3bceb029295d54e066b1d47f029f669b681d83813a3a579161832e": "/images/assessment/rhyming/variants/an/pan-02.webp",
  "1c78681f3b391f0815d67b19e30226ebb3bae8da83c380087be4996cd97fd4b0": "/images/assessment/rhyming/variants/ap/nap-02.webp",
  "06d2ccc2e4bdc423ac5ba111a9d42c2c02689ce04b81372f7283d52560d3f2db": "/images/assessment/rhyming/variants/ap/tap-02.webp",
  "805ab10fc9b3c8e93849750841b9619816f863b41296e36167f0349dffc20e47": "/images/assessment/rhyming/variants/at/cat-02.webp",
  "1cbdc5aa2121896bd94781d01923c49ac3b1f673f55ed7ea1f4926deb3b34e28": "/images/assessment/rhyming/variants/at/mat-02.webp",
  "3a73b2cca234916a610f7e63089bc8c82ade7ad972302ab238bce99f4f669fd3": "/images/assessment/rhyming/variants/cup/cup-02.webp",
  "7bdd1a9dab69dad0e05880d2f06037052b47c15b05c709b68dc04bd8364c42c6": "/images/assessment/rhyming/variants/ed/red-02.webp",
  "4ab711c3ecd09cfc05b688f6966965d738f6fe82770e63a8fea92e67c0fe1350": "/images/assessment/rhyming/variants/hut/hut-02.webp",
  "8677bf9c3197c0d0d0a6942cf978fd0b909945b5b9a3b71f4f4d66fb1e1aca5d": "/images/assessment/rhyming/variants/ig/dig-02.webp",
  "e4ca6cf9ce521c3f7d228899541d4a643d661c6a03f485b76af053bdb2d1c771": "/images/assessment/release-media/zebra-35caf16d.webp"
});

const SEMANTICALLY_AMBIGUOUS_PATH_BY_SHA256 = Object.freeze({
  "0f81180c8c380bb8c32792936ad6115919e7b56497b3170164ee52a6406ed549": "/images/assessment/objective-words/hut.webp",
  "b95786f893f8f565bff349ea899bf54221bf854dd22668c2f18fc592a7314278": "/images/assessment/objective-words/ram.webp",
  "fcfdb50894cfe9e1bf8fc4cabe709f2d25f683b70344f26231f5ef22feb9c8e2": "/images/assessment/objective-words/tap.webp"
});

const FORBIDDEN_ASSESSMENT_PATHS = new Set([
  ...Object.values(CROP_CONTAMINATED_PATH_BY_SHA256),
  ...Object.values(SEMANTICALLY_AMBIGUOUS_PATH_BY_SHA256)
]);

test("the severe active-v3 media rejection evidence and generated hash map are current", () => {
  const output = execFileSync(
    process.execPath,
    ["tools/assessmentRebuild/recordAssessmentMediaAuditRejections.mjs", "--check"],
    { cwd: ROOT, encoding: "utf8" }
  );
  assert.match(output, /^Verified 320 severe-audit image rejections\./);
  assert.equal(ASSESSMENT_MEDIA_AUDIT_REVIEW_VERSION, "active-v3-severe-audit-2026-08-31-v4");
  assert.equal(Object.keys(ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES).length, 320);

  for (const [sha256, evidence] of Object.entries(ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES)) {
    assert.match(sha256, /^[a-f0-9]{64}$/);
    assert.match(evidence.path, /^\/images\/assessment\/.+\.webp$/);
    assert.ok(evidence.reason);
    assert.ok(evidence.reasonCode);
    assert.ok(evidence.sourceScope);
  }
});

test("confirmed crop-contaminated paths and exact pixels remain rejected", () => {
  for (const [sha256, assetPath] of Object.entries(CROP_CONTAMINATED_PATH_BY_SHA256)) {
    assert.equal(ASSESSMENT_REJECTED_IMAGE_HASHES[sha256]?.path, assetPath, sha256);
    assert.ok(ASSESSMENT_REJECTED_IMAGE_HASHES[sha256]?.reason, assetPath);
  }
});

test("tap, ram, and hut artwork remains rejected as hidden scoring evidence", () => {
  for (const [sha256, assetPath] of Object.entries(SEMANTICALLY_AMBIGUOUS_PATH_BY_SHA256)) {
    assert.equal(ASSESSMENT_REJECTED_IMAGE_HASHES[sha256]?.path, assetPath, sha256);
    assert.ok(ASSESSMENT_REJECTED_IMAGE_HASHES[sha256]?.reason, assetPath);
  }
});

test("no authored v3 item resolves a forbidden path or rejected bitmap", async () => {
  const authoringFiles = fs.readdirSync(AUTHORING_DIR)
    .filter(file => file.endsWith(".mjs"))
    .sort();
  const failures = [];

  for (const file of authoringFiles) {
    const source = (await import(pathToFileURL(path.join(AUTHORING_DIR, file)))).default;
    const blueprint = skillBlueprints[source.skillId];
    const items = expandBank(source, blueprint, source.imageResolver || makeImageResolver());

    for (const item of items) {
      for (const assetPath of imagePaths(item)) {
        if (FORBIDDEN_ASSESSMENT_PATHS.has(assetPath)) {
          failures.push({
            itemId: item.id,
            activePath: assetPath,
            rejectedPath: assetPath,
            reason: "confirmed forbidden assessment path"
          });
          continue;
        }
        const absolutePath = path.join(ROOT, "public", assetPath.replace(/^\//, ""));
        if (!fs.existsSync(absolutePath)) continue;
        const sha256 = createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
        const rejection = ASSESSMENT_REJECTED_IMAGE_HASHES[sha256];
        if (rejection) {
          failures.push({
            itemId: item.id,
            activePath: assetPath,
            rejectedPath: rejection.path,
            reason: rejection.reason
          });
        }
      }
    }
  }

  assert.equal(
    failures.length,
    0,
    `${failures.length} active uses still match rejected assessment pixels:\n${JSON.stringify(failures.slice(0, 20), null, 2)}`
  );
});
