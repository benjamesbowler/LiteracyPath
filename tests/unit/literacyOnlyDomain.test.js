import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateLiteracyOnlyDomain } from "../../tools/checkLiteracyOnlyDomain.mjs";

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "literacy-only-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  }
  return root;
}

test("the complete repository is literacy-only", () => {
  assert.deepEqual(validateLiteracyOnlyDomain(), []);
});

test("ordinary programming Math primitives are allowed", () => {
  const root = fixture({ "src/score.js": "const score = Math.max(0, Math.floor(value));\n" });
  assert.deepEqual(validateLiteracyOnlyDomain({ root, files: ["src/score.js"] }), []);
});

test("retired domain copy and paths fail the gate", () => {
  const root = fixture({
    "src/old-lesson.js": "export const label = 'Mathematics lesson';\n",
    "public/images/maths-card.webp": "not-a-real-image"
  });
  const issues = validateLiteracyOnlyDomain({
    root,
    files: ["src/old-lesson.js", "public/images/maths-card.webp"]
  });
  assert.ok(issues.some(issue => /Mathematics/.test(issue)));
  assert.ok(issues.some(issue => /retired domain term remains in its path/.test(issue)));
});

test("the cleanup tombstone may drop retired objects but never recreate them", () => {
  const relativePath = "supabase/migrations/20260821220000_retired_domain_cleanup.sql";
  const goodRoot = fixture({ [relativePath]: "drop table if exists public.maths_scores;\n" });
  assert.deepEqual(validateLiteracyOnlyDomain({ root: goodRoot, files: [relativePath] }), []);

  const badRoot = fixture({
    [relativePath]: "drop table if exists public.maths_scores;\ncreate table public.maths_scores(id uuid);\n"
  });
  assert.ok(validateLiteracyOnlyDomain({ root: badRoot, files: [relativePath] }).some(issue => /never recreate/.test(issue)));
});

test("Blender Python numerical imports are allowed while retired product copy still fails", () => {
  const file = "tools/blender/scene.py";
  const root = fixture({ [file]: "import math\nangle = math.pi / 2\nheight = math.sin(angle)\n" });
  assert.deepEqual(validateLiteracyOnlyDomain({ root, files: [file] }), []);
  fs.appendFileSync(path.join(root, file), "label = 'Math lesson'\n");
  assert.ok(validateLiteracyOnlyDomain({ root, files: [file] }).some(issue => /retired domain term/.test(issue)));
});

test("canonical World Discovery classification citations do not exempt product copy", () => {
  const file = "src/content/world-discovery/cohorts/11-20/level-e.json";
  const url = "https://nrich.maths.org/problems/carroll-diagrams";
  const book = {
    id: "world-discovery-e-19",
    storyBibleReview: { scienceSources: [{ url, evidence: "Classify by two properties." }] },
    pages: [{ text: "The red circle fits here." }]
  };
  const root = fixture({ [file]: JSON.stringify([book], null, 2) });
  const writeBook = value => fs.writeFileSync(path.join(root, file), JSON.stringify([value], null, 2));
  assert.deepEqual(validateLiteracyOnlyDomain({ root, files: [file] }), []);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, file), "utf8"))[0].storyBibleReview.scienceSources[0].url, url);

  for (const invalid of [
    { ...book, pages: [{ text: "A maths lesson." }] },
    { ...book, url },
    { ...book, storyBibleReview: { scienceSources: [{ url, evidence: "A maths lesson." }] } },
    { ...book, storyBibleReview: { scienceSources: [{ url: `${url}/maths-lesson` }] } },
    { ...book, id: "unrelated-book" }
  ]) {
    writeBook(invalid);
    assert.ok(validateLiteracyOnlyDomain({ root, files: [file] }).some(issue => /retired domain term/.test(issue)));
  }

  const otherFile = "src/other.json";
  const otherRoot = fixture({ [otherFile]: JSON.stringify([book]) });
  assert.ok(validateLiteracyOnlyDomain({ root: otherRoot, files: [otherFile] }).some(issue => /retired domain term/.test(issue)));
});

test("next-cohort academic citations are scoped to exact books and provenance fields", () => {
  const references = [
    { id: "world-discovery-a-29", level: "a", url: "https://nrich.maths.org/eyfs-activities/two-halves", title: "University of Cambridge NRICH: Two Halves" },
    { id: "world-discovery-b-29", level: "b", url: "https://www.ncetm.org.uk/classroom-resources/ey-measures/", title: "National Centre for Excellence in the Teaching of Mathematics: Measures" },
    { id: "world-discovery-c-29", level: "c", url: "https://www.ncetm.org.uk/classroom-resources/cp-year-3-unit-11-time/", title: "National Centre for Excellence in the Teaching of Mathematics: Time" }
  ];
  for (const { id, level, url, title } of references) {
    const file = `src/content/world-discovery/cohorts/21-30/level-${level}.json`;
    const book = { id, storyBibleReview: { scienceSources: [{ url, title, evidence: "Supports the observed example." }] }, pages: [{ text: "Look at the whole strip." }] };
    const root = fixture({ [file]: JSON.stringify([book]) });
    const writeBook = value => fs.writeFileSync(path.join(root, file), JSON.stringify([value]));
    assert.deepEqual(validateLiteracyOnlyDomain({ root, files: [file] }), []);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, file), "utf8")), [book]);
    for (const invalid of [
      { ...book, id: "world-discovery-a-28" },
      { ...book, pages: [{ text: "A mathematics lesson." }] },
      { ...book, storyBibleReview: { scienceSources: [{ url, title, evidence: "A maths lesson." }] } },
      { ...book, storyBibleReview: { scienceSources: [{ url: `${url}other`, title }] } },
      { ...book, storyBibleReview: { scienceSources: [{ url, title: `${title}: Mathematics lesson` }] } }
    ]) {
      writeBook(invalid);
      assert.ok(validateLiteracyOnlyDomain({ root, files: [file] }).length, `${id}: changed identity or surrounding copy must fail`);
    }
  }
  const file = "src/content/world-discovery/cohorts/21-30/reviews.json";
  const url = references[0].url;
  const review = { "world-discovery-a-29": { sourceReview: { urls: [url], assessment: "The reference supports equal halves." } } };
  const endingEvidence = "Each piece is half the strip follows the all-around edge match and restored whole, earning the mathematical word.";
  review["world-discovery-a-29"].editorialScorecard = { categories: { ending: { score: 4, evidence: endingEvidence } } };
  const root = fixture({ [file]: JSON.stringify(review) });
  assert.deepEqual(validateLiteracyOnlyDomain({ root, files: [file] }), []);
  for (const invalid of [
    { "world-discovery-a-28": review["world-discovery-a-29"] },
    { "world-discovery-a-29": { sourceReview: { urls: [url], assessment: "A maths lesson." } } },
    { "world-discovery-a-29": { sourceReview: { urls: [`${url}/maths`] } } },
    { "world-discovery-a-29": { sourceReview: { urls: [url] }, other: url } },
    { "world-discovery-a-29": { other: endingEvidence } },
    { "world-discovery-a-29": { editorialScorecard: { categories: { ending: { evidence: `${endingEvidence} A maths lesson.` } } } } }
  ]) {
    fs.writeFileSync(path.join(root, file), JSON.stringify(invalid));
    assert.ok(validateLiteracyOnlyDomain({ root, files: [file] }).length);
  }
});
