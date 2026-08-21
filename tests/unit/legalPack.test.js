import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_LEGAL_RULES,
  readPublicLegalPages,
  validateLegalImplementation,
  validateLegalPack,
  validatePublicLegalDocuments
} from "../../tools/checkLegalPack.mjs";

test("the current UK legal pack passes every release rule", () => {
  assert.deepEqual(validateLegalPack(), []);
});

test("the gate fails when a public legal page is absent", () => {
  const documents = readPublicLegalPages();
  delete documents["terms.html"];
  assert.ok(validatePublicLegalDocuments(documents).includes("public/terms.html: missing"));
});

test("the gate rejects a false compliance claim and approval queue wording", () => {
  const documents = readPublicLegalPages();
  documents["privacy.html"] += "<p>Fully compliant; awaiting human approval.</p>";
  const issues = validatePublicLegalDocuments(documents);
  assert.ok(issues.filter(issue => /false or obsolete/.test(issue)).length >= 2);
});

test("every public page has substantive subject coverage", () => {
  assert.equal(Object.keys(PUBLIC_LEGAL_RULES).length, 6);
  for (const [file, terms] of Object.entries(PUBLIC_LEGAL_RULES)) {
    assert.ok(terms.length >= 7, `${file} must enforce at least seven subjects`);
  }
});

test("legal pages cannot add active scripts or an external stylesheet", () => {
  const documents = readPublicLegalPages();
  documents["cookies.html"] = documents["cookies.html"]
    .replace("</head>", '<script src="https://example.invalid/x.js"></script><link rel="stylesheet" href="https://example.invalid/x.css" /></head>');
  const issues = validatePublicLegalDocuments(documents);
  assert.ok(issues.some(issue => /must not execute scripts/.test(issue)));
  assert.ok(issues.some(issue => /external stylesheet/.test(issue)));
});

test("versioned acceptance, footer routing, and owner gaps are wired into the app", () => {
  assert.deepEqual(validateLegalImplementation(), []);
});
