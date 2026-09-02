import { expect, test } from "@playwright/test";

import { SOUND_SEEKERS_BIOME_KITS } from "../../src/features/soundSeekers/content/biomeKits.js";
import { SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX } from "../../tools/lib/soundSeekersV2GalleryManifest.mjs";

async function observedTask4SemanticIds(page) {
  return page.locator("[data-task4-rendered-subtree]").evaluate(root => {
    const attributes = [
      "data-semantic-id", "data-code-native-semantic", "data-route-id",
      "data-landmark-id", "data-visual-state-id", "data-option-visual-id",
      "data-choice-frame", "data-option-prop", "data-option-action",
      "data-meaning-semantic-id", "data-prop-family"
    ];
    const values = attributes.flatMap(attribute => [...root.querySelectorAll(`[${attribute}]`)]
      .map(node => node.getAttribute(attribute)));
    values.push(...[...root.querySelectorAll("[data-character-id]")]
      .map(node => `character:${node.getAttribute("data-character-id").toLocaleLowerCase("en-US")}`));
    return [...new Set(values.filter(Boolean))].sort();
  });
}

for (const kit of SOUND_SEEKERS_BIOME_KITS) {
  test(`code-native semantics stay separate from ${kit.id} raster review metadata`, async ({ page }) => {
    const records = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.filter(record =>
      record.kind === "scene-options" && record.chapterId === kit.id);
    expect(records).toHaveLength(5);
    for (const record of records) {
      await page.goto(record.url);
      await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
      await expect(page.locator("[data-gallery-semantic-inventory]")).toHaveCount(0);
      const observed = await observedTask4SemanticIds(page);
      expect(observed, record.id).toEqual(record.expectedCodeNativeSemanticIds);
      for (const id of kit.backdropReviewSemanticIds) expect(observed).not.toContain(id);
      for (const id of observed.filter(id => !id.startsWith("route:"))) {
        expect(kit.codeNativeSemanticIds).toContain(id);
      }
      expect(observed).toContain(`route:${record.stopId}`);
    }
  });
}
