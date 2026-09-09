import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { EL_CYCLE_POEMS } from "../../src/data/elCyclePoems.js";
import { EL_CYCLE_POEM_IMAGES, cyclePoemImagePath } from "../../src/data/elCyclePoemImages.js";
import { buildCyclePresentation } from "../../src/utils/present/presentationBuilder.js";

test("every poem uses its distinct visually reviewed illustration and cache revision", () => {
  assert.deepEqual(Object.keys(EL_CYCLE_POEM_IMAGES).map(Number), EL_CYCLE_POEMS.map(poem => poem.cycle));
  const fingerprints = new Set();
  for (const poem of EL_CYCLE_POEMS) {
    const image = EL_CYCLE_POEM_IMAGES[poem.cycle];
    const bytes = readFileSync(new URL(`../../public${image.src}`, import.meta.url));
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.equal(hash, image.sha256, `cycle ${poem.cycle}: changed image needs visual review and a new fingerprint`);
    assert.ok(!fingerprints.has(hash), `cycle ${poem.cycle}: duplicate illustration`);
    fingerprints.add(hash);
    const { html } = buildCyclePresentation(`cycle-${poem.cycle}`);
    const hero = html.match(/<img class="p-poem-hero[^>]+>/)?.[0];
    assert.ok(hero?.includes(`src="${cyclePoemImagePath(poem.cycle)}"`), `cycle ${poem.cycle}: deck must select its reviewed image`);
    assert.ok(cyclePoemImagePath(poem.cycle).endsWith(`?v=${hash.slice(0, 12)}`));
    assert.match(html, /\.p-poem-hero\s*\{[^}]*object-fit:\s*contain/, "all characters must remain visible without cropping");
  }
});
