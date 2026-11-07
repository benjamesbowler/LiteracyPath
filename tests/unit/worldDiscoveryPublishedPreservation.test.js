import test from "node:test";
import assert from "node:assert/strict";
import fixture from "../fixtures/world-discovery/published-first-50.json" with { type: "json" };
import { collectPublishedWorldDiscoverySnapshot, PUBLISHED_WORLD_DISCOVERY_IDS } from "../helpers/worldDiscoveryPublishedSnapshot.js";

test("the published first fifty World Discovery books, reviews and consumed media remain unchanged", () => {
  const current = collectPublishedWorldDiscoverySnapshot();
  assert.deepEqual(current.runtimeOrder, PUBLISHED_WORLD_DISCOVERY_IDS);
  assert.deepEqual(current, fixture.snapshot, "Original published source, runtime bindings, review rows or actual media bytes changed; expansion must be additive");
});
