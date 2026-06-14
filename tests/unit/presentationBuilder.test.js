import test from "node:test";
import assert from "node:assert/strict";
import {
  presentationCycleOptions,
  buildCyclePresentation
} from "../../src/utils/present/presentationBuilder.js";

test("cycle options cover the numbered cycles", () => {
  const opts = presentationCycleOptions();
  assert.ok(opts.length >= 27);
  assert.ok(opts.every(o => o.id && o.cycleNumber && o.title));
});

test("a letter cycle deck has letter, writing, sight, phoneme and poem slides", () => {
  const { html, slideCount } = buildCyclePresentation("cycle-2");
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(slideCount >= 8);
  assert.ok(html.includes("p-letter-slide"), "has a letter-sound slide");
  assert.ok(html.includes("p-writing"), "has a writing slide");
  assert.ok(html.includes("p-sight-slide"), "has a sight word slide");
  assert.ok(html.includes("Change the first sound"), "has a change-sound slide");
  assert.ok(html.includes("Put words together"), "has a compound slide");
});

test("a fluency cycle deck swaps letters for pattern + chain slides", () => {
  const { html } = buildCyclePresentation("cycle-26");
  assert.ok(!html.includes("p-letter-slide"), "no new-letter slides on fluency cycles");
  assert.ok(html.includes("Pattern power"), "has a pattern slide");
  assert.ok(html.includes("Word chain"), "has a chain slide");
});

test("deck is deterministic (same cycle = same bytes)", () => {
  assert.equal(buildCyclePresentation("cycle-10").html, buildCyclePresentation("cycle-10").html);
});

test("every slide count matches the slides in the html", () => {
  const { html, slideCount } = buildCyclePresentation("cycle-16");
  assert.equal((html.match(/class="slide /g) || []).length, slideCount);
});

test("unknown cycle throws", () => {
  assert.throws(() => buildCyclePresentation("nope"));
});
