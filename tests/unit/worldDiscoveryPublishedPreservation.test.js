import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import fixture from "../fixtures/world-discovery/published-first-50.json" with { type: "json" };
import repairedFixture from "../fixtures/world-discovery/published-first-50-remediation-2026-11-09.json" with { type: "json" };
import groundingFixture from "../fixtures/world-discovery/published-first-50-grounding-2026-11-11.json" with { type: "json" };
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
  assert.equal(groundingFixture.registration, cohorts.cohorts.find(cohort => cohort.id === "01-10").registration);
  assert.deepEqual(repairedFixture.snapshot.runtimeOrder, fixture.snapshot.runtimeOrder);
  for (const category of ["cards", "references"]) {
    assert.deepEqual(repairedFixture.snapshot.assets[category], fixture.snapshot.assets[category], `Unchanged original ${category} must retain exact bytes`);
  }
  assert.deepEqual(repairedFixture.snapshot.sharedReviewRows.covers, fixture.snapshot.sharedReviewRows.covers);
});

test("the current first-fifty review permits only the exact D04 illustration and brief repair", () => {
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
  assert.deepEqual(current, expected, "Exact reviewed source, runtime, audio, media and review bindings must remain stable outside the pinned repair");
});
