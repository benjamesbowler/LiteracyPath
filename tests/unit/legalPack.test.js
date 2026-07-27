import assert from "node:assert/strict";
import test from "node:test";

import {
  LEGAL_PACK_RULES,
  readLegalPack,
  validateLegalPack,
  validateLegalPackDocuments
} from "../../tools/checkLegalPack.mjs";

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
