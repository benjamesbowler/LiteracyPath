import { expect, test } from "@playwright/test";

import {
  SOUND_SEEKERS_CONNECTED_TEXT,
  toChildConnectedTextScene
} from "../../src/features/soundSeekers/content/connectedText.js";

for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
  test(`gallery renders child-safe option inventory for ${scene.id}`, async ({ page }) => {
    const childScene = toChildConnectedTextScene(scene.id, "gallery:11");
    const fixture = scene.choice.kind === "narrative_bridge" ? "boss-resolved" : "assessed-correct-resolved";
    const option = scene.choice.kind === "narrative_bridge"
      ? `&option=${encodeURIComponent(scene.choice.options[0].visualSemanticId)}` : "";
    await page.goto(`/preview/sound-seekers-v2-content.html?scene=${scene.id}&fixture=${fixture}&density=full&motion=reduced&labels=shown&seed=11${option}`);
    await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
    await expect(page.locator("[data-gallery-root]")).toHaveAttribute("data-gallery-phase", "resolved");
    await expect(page.locator("[data-sound-seekers-scene]")).toHaveAttribute("data-scene-phase", "resolved");
    const buttons = page.locator("[data-option-visual-id]");
    await expect(buttons).toHaveCount(childScene.choice.options.length);
    expect(await buttons.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-option-visual-id"))))
      .toEqual(childScene.choice.options.map(optionRecord => optionRecord.visualSemanticId));
    await page.reload();
    await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
    expect(await page.locator("[data-option-visual-id]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-option-visual-id"))))
      .toEqual(childScene.choice.options.map(optionRecord => optionRecord.visualSemanticId));
    await expect(page.locator("[data-private-answer],[data-correct],[data-expected-token]")).toHaveCount(0);
    expect(await page.locator("[data-task4-rendered-subtree]").evaluate(root =>
      /expectedToken|private-answer|data-correct|correctness/iu.test(root.innerHTML))).toBe(false);
    const boxes = await buttons.evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
    for (let index = 1; index < boxes.length; index += 1) {
      const previous = boxes[index - 1];
      const current = boxes[index];
      const horizontal = current.x - (previous.x + previous.width);
      const vertical = current.y - (previous.y + previous.height);
      expect(Math.max(horizontal, vertical)).toBeGreaterThanOrEqual(8);
    }
  });
}

for (const inputKind of ["pointer", "touch", "Enter", "Space"]) {
  test(`${inputKind} uses the same single callback-token path with persistent focus`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 568, height: 320 },
      hasTouch: inputKind === "touch",
      isMobile: inputKind === "touch"
    });
    try {
      const page = await context.newPage();
      await page.goto("/preview/sound-seekers-v2-content.html?stop=s1&fixture=pre-choice&density=full&motion=reduced&labels=shown&seed=11");
      await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
      const first = page.locator("[data-option-visual-id]").first();
      const expectedToken = toChildConnectedTextScene("scene-s1", "gallery:11").choice.options[0].token;
      const box = await first.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      if (inputKind === "pointer") {
        await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
      } else if (inputKind === "touch") {
        await page.touchscreen.tap(box.x + (box.width / 2), box.y + (box.height / 2));
      } else {
        await first.focus();
        await page.keyboard.press(inputKind);
      }
      await expect(first).toBeFocused();
      await expect(page.locator("[data-gallery-root]")).toHaveAttribute("data-gallery-activation-count", "1");
      await expect(page.locator("[data-gallery-root]")).toHaveAttribute("data-gallery-last-activation-token", expectedToken);
      const outline = await first.evaluate(node => getComputedStyle(node).outlineWidth);
      expect(Number.parseFloat(outline)).toBeGreaterThanOrEqual(4);
      await expect(page.locator("[data-private-answer],[data-correct],[data-expected-token]")).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
}
