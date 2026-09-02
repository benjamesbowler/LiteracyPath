import { expect, test } from "@playwright/test";

import { SOUND_SEEKERS_CONNECTED_TEXT } from "../../src/features/soundSeekers/content/connectedText.js";

for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
  test(`gallery renders child-safe option inventory for ${scene.id}`, async ({ page }) => {
    const fixture = scene.choice.kind === "narrative_bridge" ? "boss-resolved" : "assessed-correct-resolved";
    const option = scene.choice.kind === "narrative_bridge"
      ? `&option=${encodeURIComponent(scene.choice.options[0].visualSemanticId)}` : "";
    await page.goto(`/preview/sound-seekers-v2-content.html?scene=${scene.id}&fixture=${fixture}&density=full&motion=reduced&labels=shown&seed=11${option}`);
    await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
    const buttons = page.locator("[data-option-visual-id]");
    await expect(buttons).toHaveCount(scene.choice.options.length);
    expect(await buttons.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-option-visual-id")).sort()))
      .toEqual(scene.choice.options.map(optionRecord => optionRecord.visualSemanticId).sort());
    await expect(page.locator("[data-private-answer],[data-correct],[data-expected-token]")).toHaveCount(0);
    const first = buttons.first();
    const box = await first.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(first).toBeFocused();
  });
}
