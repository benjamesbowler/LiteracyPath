import { expect, test } from "@playwright/test";

import { SOUND_SEEKERS_BIOME_KITS } from "../../src/features/soundSeekers/content/biomeKits.js";

for (const kit of SOUND_SEEKERS_BIOME_KITS) {
  test(`code-native semantics stay separate from ${kit.id} raster review metadata`, async ({ page }) => {
    const stop = kit.routeSpecIds[0].replace("route:", "");
    await page.goto(`/preview/sound-seekers-v2-content.html?stop=${stop}&fixture=pre-choice&density=full&motion=reduced&labels=shown&seed=11`);
    await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
    const observed = await page.locator("[data-code-native-world] [data-code-native-semantic-id]")
      .evaluateAll(nodes => nodes.map(node => node.getAttribute("data-code-native-semantic-id")));
    for (const id of kit.backdropReviewSemanticIds) expect(observed).not.toContain(id);
    const expected = await page.locator("[data-gallery-root]").getAttribute("data-expected-code-native-ids");
    expect(observed.sort()).toEqual(JSON.parse(expected).sort());
  });
}
