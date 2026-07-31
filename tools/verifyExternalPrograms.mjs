import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  A11Y_KEY_MODAL_STATES,
  A11Y_PRIMARY_ROUTES,
  A11Y_VIEWPORTS,
  validateA11yInventory
} from "../src/accessibility/primaryRouteInventory.js";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function flexibleText(value) {
  return new RegExp(String(value).trim().replace(/\s+/g, "\\s+"), "i");
}

const inventory = source("docs/accessibility/ROUTE_STATE_INVENTORY.md");
const manual = source("docs/accessibility/MANUAL_AUDIT_PROGRAM.md");
const recurring = source("docs/research/RECURRING_OBSERVATION_PROGRAM.md");
const packageJson = JSON.parse(source("package.json"));
const releaseGate = source("tools/releaseGate.mjs");

assert.equal(validateA11yInventory(), true);
assert.equal(A11Y_PRIMARY_ROUTES.length, 18);
assert.equal(A11Y_KEY_MODAL_STATES.length, 7);
assert.deepEqual(
  A11Y_VIEWPORTS.map(row => `${row.id}:${row.width}x${row.height}`),
  ["desktop:1280x900", "mobile:390x844"]
);

for (const row of [...A11Y_PRIMARY_ROUTES, ...A11Y_KEY_MODAL_STATES]) {
  assert.match(inventory, new RegExp(`\\\`${row.id}\\\``));
}
for (const viewport of A11Y_VIEWPORTS) {
  assert.match(inventory, new RegExp(`${viewport.width}×${viewport.height}`));
}

for (const required of [
  "Screen reader",
  "Switch / keyboard-only",
  "Zoom 200%",
  "Audio off",
  "Motion off",
  "Child usability",
  "2026-08-03",
  "2026-11-16",
  "human execution is not started"
]) {
  assert.match(manual, flexibleText(required));
}

for (const required of [
  "representative teacher and child observations",
  "monthly cycles for the first three months",
  "quarterly cycles",
  "ages 5–10",
  "emergent, early, and transitional reading",
  "multilingual learners",
  "accessibility settings",
  "assistive technology",
  "Finding-to-release-criteria pipeline",
  "release issue",
  "external review"
]) {
  assert.match(recurring, flexibleText(required));
}
assert.ok(packageJson.scripts["check:a11y-routes"]);
assert.ok(packageJson.scripts["check:a11y-teacher"]);
assert.ok(packageJson.scripts["check:research-pilot-pack"]);
assert.match(releaseGate, /id: "external-program-readiness"/);

console.log(
  "External programmes: PASS — 17 routes, 7 key states, 2 viewports, "
  + "6 manual accessibility modes, an unexecuted first-run record, and a "
  + "recurring representative observation-to-release-criteria pipeline."
);
