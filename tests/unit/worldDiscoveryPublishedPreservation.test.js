import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import fixture from "../fixtures/world-discovery/published-first-50.json" with { type: "json" };
import repairedFixture from "../fixtures/world-discovery/published-first-50-remediation-2026-11-09.json" with { type: "json" };
import groundingFixture from "../fixtures/world-discovery/published-first-50-grounding-2026-11-11.json" with { type: "json" };
import wardrobeFixture from "../fixtures/world-discovery/published-first-50-wardrobe-2026-11-22.json" with { type: "json" };
import readingQualityFixture from "../fixtures/world-discovery/published-first-50-reading-quality-2026-11-22.json" with { type: "json" };
import cohorts from "../../src/content/world-discovery/cohorts.json" with { type: "json" };
import { collectPublishedWorldDiscoverySnapshot, PUBLISHED_WORLD_DISCOVERY_IDS } from "../helpers/worldDiscoveryPublishedSnapshot.js";

test("the original first-fifty release fixture remains immutable after the authorized repair", () => {
  const bytes = fs.readFileSync(new URL("../fixtures/world-discovery/published-first-50.json", import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "ebfa91d8554550abd92aee64dd9db13307fa2bd1f54de36bfa77ef57bc2cb09d");
  assert.equal(repairedFixture.originalFixtureSha256, "ebfa91d8554550abd92aee64dd9db13307fa2bd1f54de36bfa77ef57bc2cb09d");
  const evidence = fs.readFileSync(new URL(`../../${repairedFixture.evidence.completeBookReview}`, import.meta.url));
  assert.equal(createHash("sha256").update(evidence).digest("hex"), repairedFixture.evidence.sha256);
  const repairedBytes = fs.readFileSync(new URL("../fixtures/world-discovery/published-first-50-remediation-2026-11-09.json", import.meta.url));
  assert.equal(createHash("sha256").update(repairedBytes).digest("hex"), groundingFixture.priorFixtureSha256);
  const groundingEvidence = fs.readFileSync(new URL(`../../${groundingFixture.completeBookReview}`, import.meta.url));
  assert.equal(createHash("sha256").update(groundingEvidence).digest("hex"), groundingFixture.completeBookReviewSha256);
  const groundingBytes = fs.readFileSync(new URL("../fixtures/world-discovery/published-first-50-grounding-2026-11-11.json", import.meta.url));
  assert.equal(createHash("sha256").update(groundingBytes).digest("hex"), wardrobeFixture.priorFixtureSha256);
  const wardrobeEvidence = fs.readFileSync(new URL(`../../${wardrobeFixture.completeBookReview}`, import.meta.url));
  assert.equal(createHash("sha256").update(wardrobeEvidence).digest("hex"), wardrobeFixture.completeBookReviewSha256);
  const wardrobeBytes = fs.readFileSync(new URL("../fixtures/world-discovery/published-first-50-wardrobe-2026-11-22.json", import.meta.url));
  assert.equal(createHash("sha256").update(wardrobeBytes).digest("hex"), readingQualityFixture.priorFixtureSha256);
  const readingEvidence = fs.readFileSync(new URL(`../../${readingQualityFixture.completeBookReview}`, import.meta.url));
  assert.equal(createHash("sha256").update(readingEvidence).digest("hex"), readingQualityFixture.completeBookReviewSha256);
  const currentRegistration = cohorts.cohorts.find(cohort => cohort.id === "01-10").registration;
  assert.equal(readingQualityFixture.registration, currentRegistration);
  const registrationBytes = fs.readFileSync(new URL(`../../${currentRegistration}`, import.meta.url));
  assert.equal(createHash("sha256").update(registrationBytes).digest("hex"), readingQualityFixture.registrationSha256);
  for (const row of wardrobeFixture.archivedDeliveries) {
    const archivedBytes = fs.readFileSync(new URL(`../../${row.path}`, import.meta.url));
    assert.equal(createHash("sha256").update(archivedBytes).digest("hex"), row.sha256);
  }
  assert.deepEqual(repairedFixture.snapshot.runtimeOrder, fixture.snapshot.runtimeOrder);
  for (const category of ["cards", "references"]) {
    assert.deepEqual(repairedFixture.snapshot.assets[category], fixture.snapshot.assets[category], `Unchanged original ${category} must retain exact bytes`);
  }
  assert.deepEqual(repairedFixture.snapshot.sharedReviewRows.covers, fixture.snapshot.sharedReviewRows.covers);
});

test("the current first-fifty review binds the D04 art and exact approved prose and audio changes", () => {
  const current = collectPublishedWorldDiscoverySnapshot();
  assert.deepEqual(current.runtimeOrder, PUBLISHED_WORLD_DISCOVERY_IDS);
  const { delta } = groundingFixture;
  assert.deepEqual(Object.keys(delta).sort(), ["assets", "runtimeBindings", "sharedReviewRows", "sourceFiles"]);
  assert.deepEqual(Object.keys(delta.sourceFiles).sort(), [
    "src/content/world-discovery/level-d.json", "src/content/world-discovery/reviews.json"
  ]);
  assert.deepEqual(Object.keys(delta.runtimeBindings), ["world-discovery-d-04"]);
  assert.deepEqual(Object.keys(delta.assets).sort(), ["illustrations", "receipts"]);
  assert.deepEqual(Object.keys(delta.sharedReviewRows).sort(), ["appVisual", "pageAlignment"]);
  const expected = structuredClone(repairedFixture.snapshot);
  for (const [group, values] of Object.entries(delta)) Object.assign(expected[group], values);
  const wardrobeDelta = wardrobeFixture.delta;
  assert.deepEqual(Object.keys(wardrobeDelta).sort(), ["assets", "sharedReviewRows", "sourceFiles"]);
  assert.deepEqual(Object.keys(wardrobeDelta.sourceFiles), ["src/content/world-discovery/reviews.json"]);
  assert.deepEqual(Object.keys(wardrobeDelta.assets).sort(), ["illustrations", "receipts"]);
  assert.deepEqual(Object.keys(wardrobeDelta.sharedReviewRows).sort(), ["appVisual", "pageAlignment"]);
  for (const [group, values] of Object.entries(wardrobeDelta)) Object.assign(expected[group], values);
  const readingDelta = readingQualityFixture.delta;
  assert.deepEqual(Object.keys(readingDelta).sort(), ["assets", "runtimeBindings", "sharedReviewRows", "sourceFiles"]);
  assert.deepEqual(Object.keys(readingDelta.sourceFiles).sort(), [
    ...[..."abcde"].map(level => `src/content/world-discovery/level-${level}.json`), "src/content/world-discovery/reviews.json"
  ]);
  assert.deepEqual(Object.keys(readingDelta.assets).sort(), ["pageAudio", "receipts", "wordAudio"]);
  assert.deepEqual(Object.keys(readingDelta.sharedReviewRows).sort(), ["narrationClearance", "pageAlignment"]);
  const completeReview = JSON.parse(fs.readFileSync(new URL(`../../${readingQualityFixture.completeBookReview}`, import.meta.url)));
  assert.equal(completeReview.books.length, 18);
  assert.equal(completeReview.books.reduce((count, book) => count + book.changes.length, 0), 26);
  const reviewedPages = Object.fromEntries(completeReview.books.map(book => [book.bookId, book.changes.map(change => change.pageNumber)]));
  assert.deepEqual(readingQualityFixture.changedBooks, reviewedPages);
  assert.deepEqual(Object.keys(readingDelta.runtimeBindings).sort(), Object.keys(reviewedPages).sort());
  for (const [group, values] of Object.entries(readingDelta)) Object.assign(expected[group], values);
  assert.deepEqual(current, expected, "Exact reviewed source, runtime, audio, media and review bindings must remain stable outside the pinned repair");
});
