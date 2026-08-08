import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  LEGAL_PACK_RULES,
  readLegalPack,
  reviewDateFrom,
  validateLegalPack,
  validateLegalPackDocuments,
  validatePublicPrivacyPage
} from "../../tools/checkLegalPack.mjs";

/**
 * Writes a throwaway repo root containing only the two files the public-page
 * rules look at, so the date-sync rule can be tested against a real mismatch
 * rather than against a mock of itself.
 */
function scratchRoot({ sourceDate, pageDate }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "legal-pack-"));
  fs.mkdirSync(path.join(root, "docs", "legal"), { recursive: true });
  fs.mkdirSync(path.join(root, "public"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "docs", "legal", "PRIVACY_POLICY.md"),
    `> **Last reviewed against the product:** ${sourceDate}\n`
  );
  fs.writeFileSync(
    path.join(root, "public", "privacy.html"),
    `<p>Last reviewed against the product: ${pageDate}</p>\n`
  );
  return root;
}

test("the repository legal pack satisfies every structural external-readiness rule", () => {
  assert.deepEqual(validateLegalPack(), []);
});

test("the legal-pack gate fails closed when a required document is absent", () => {
  const documents = readLegalPack();
  delete documents["DATA_PROCESSING_ADDENDUM_DRAFT.md"];
  const issues = validateLegalPackDocuments(documents);
  assert.ok(issues.some(issue => issue === "DATA_PROCESSING_ADDENDUM_DRAFT.md: missing"));
});

test("the legal-pack gate rejects a fabricated approval and completed counsel checks", () => {
  const documents = readLegalPack();
  documents["TERMS_OF_SERVICE_DRAFT.md"] += "\nStatus: approved\n";
  documents["COUNSEL_REVIEW_CHECKLIST.md"] =
    documents["COUNSEL_REVIEW_CHECKLIST.md"].replace("- [ ]", "- [x]");
  const issues = validateLegalPackDocuments(documents);
  assert.ok(issues.some(issue => /false legal-approval/.test(issue)));
  assert.ok(issues.some(issue => /must not self-complete/.test(issue)));
});

test("each legal document has a substantive rule set rather than presence-only coverage", () => {
  assert.equal(Object.keys(LEGAL_PACK_RULES).length, 12);
  for (const [file, terms] of Object.entries(LEGAL_PACK_RULES)) {
    assert.ok(terms.length >= 8, `${file} must have at least eight subject assertions`);
  }
});

test("the gate rejects the retired claim that no child reaches the product outside a school", () => {
  const documents = readLegalPack();
  documents["PRIVACY_POLICY.md"] +=
    "\nWe do not knowingly offer independent child sign-up or collect information"
    + " from children outside the school-managed context.\n";
  const issues = validateLegalPackDocuments(documents);
  assert.ok(
    issues.some(issue => /repeats the retired claim/.test(issue)),
    "reintroducing the pre-try-out sentence must fail the gate"
  );
});

test("the gate rejects a \"collects nothing\" claim with the platform-log caveat removed", () => {
  const documents = readLegalPack();
  // Strip every mention of what the host still sees, leaving the bare claim.
  documents["PRIVACY_POLICY.md"] = documents["PRIVACY_POLICY.md"]
    .replace(/platform logs?/gi, "REDACTED")
    .replace(/request metadata/gi, "REDACTED");
  const issues = validateLegalPackDocuments(documents);
  assert.ok(
    issues.some(issue => /without disclosing that the host still records/.test(issue)),
    "the honest caveat must be load-bearing, not decorative"
  );
});

test("the public page review date is read from the source rather than hardcoded", () => {
  assert.equal(
    reviewDateFrom("> **Last reviewed against the product:** 8 August 2026\n"),
    "8 August 2026"
  );

  const matched = scratchRoot({ sourceDate: "8 August 2026", pageDate: "8 August 2026" });
  assert.equal(
    validatePublicPrivacyPage(matched).filter(issue => /review date/.test(issue)).length,
    0,
    "a page whose date matches the source must not be flagged"
  );

  const drifted = scratchRoot({ sourceDate: "1 September 2026", pageDate: "8 August 2026" });
  assert.ok(
    validatePublicPrivacyPage(drifted).some(issue => /review date is out of sync/.test(issue)),
    "a page left behind by a policy revision must fail"
  );
});

test("required subjects are found even when the source wrapped them across a line", () => {
  const documents = readLegalPack();
  documents["REGION_MATRIX.md"] = documents["REGION_MATRIX.md"]
    .replace(/anonymous\s+try-out/i, "anonymous\ntry-out");
  const issues = validateLegalPackDocuments(documents);
  assert.ok(
    !issues.some(issue => /REGION_MATRIX\.md: missing required subject "anonymous try-out"/.test(issue)),
    "a hard line wrap is not a missing subject"
  );
});
