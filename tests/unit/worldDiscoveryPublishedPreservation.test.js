import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import fixture from "../fixtures/world-discovery/published-first-50.json" with { type: "json" };
import repairedFixture from "../fixtures/world-discovery/published-first-50-remediation-2026-11-09.json" with { type: "json" };
import cohorts from "../../src/content/world-discovery/cohorts.json" with { type: "json" };
import { collectPublishedWorldDiscoverySnapshot, PUBLISHED_WORLD_DISCOVERY_IDS } from "../helpers/worldDiscoveryPublishedSnapshot.js";

test("the original first-fifty release fixture remains immutable after the authorized repair", () => {
  const bytes = fs.readFileSync(new URL("../fixtures/world-discovery/published-first-50.json", import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "ebfa91d8554550abd92aee64dd9db13307fa2bd1f54de36bfa77ef57bc2cb09d");
  assert.equal(repairedFixture.originalFixtureSha256, "ebfa91d8554550abd92aee64dd9db13307fa2bd1f54de36bfa77ef57bc2cb09d");
  const evidence = fs.readFileSync(new URL(`../../${repairedFixture.evidence.completeBookReview}`, import.meta.url));
  assert.equal(createHash("sha256").update(evidence).digest("hex"), repairedFixture.evidence.sha256);
  assert.equal(repairedFixture.evidence.registration, cohorts.cohorts.find(cohort => cohort.id === "01-10").registration);
  assert.deepEqual(repairedFixture.snapshot.runtimeOrder, fixture.snapshot.runtimeOrder);
  for (const category of ["cards", "references"]) {
    assert.deepEqual(repairedFixture.snapshot.assets[category], fixture.snapshot.assets[category], `Unchanged original ${category} must retain exact bytes`);
  }
  assert.deepEqual(repairedFixture.snapshot.sharedReviewRows.covers, fixture.snapshot.sharedReviewRows.covers);
});

test("the reviewed first-fifty repair stays exact during later expansion", () => {
  const current = collectPublishedWorldDiscoverySnapshot();
  assert.deepEqual(current.runtimeOrder, PUBLISHED_WORLD_DISCOVERY_IDS);
  assert.deepEqual(current, repairedFixture.snapshot, "Reviewed repair source, runtime bindings, review rows or actual media bytes changed; later expansion must remain additive");
});
