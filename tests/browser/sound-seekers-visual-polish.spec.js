import { expect, test } from "@playwright/test";

import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import { SOUND_SEEKERS_CONNECTED_TEXT } from "../../src/features/soundSeekers/content/connectedText.js";

const PROFILES = [
  { id: "landscape", viewport: { width: 568, height: 320 }, zoom: 1 },
  { id: "portrait", viewport: { width: 320, height: 568 }, zoom: 1 },
  { id: "tablet", viewport: { width: 1194, height: 834 }, zoom: 1 },
  { id: "zoom-200", viewport: { width: 640, height: 1136 }, zoom: 2 }
];

function intersects(left, right) {
  return Math.min(left.right, right.right) - Math.max(left.x, right.x) > 2
    && Math.min(left.bottom, right.bottom) - Math.max(left.y, right.y) > 2;
}

async function visibleUnion(page, selector) {
  return page.locator(selector).evaluateAll(nodes => {
    const boxes = nodes.map(node => node.getBoundingClientRect()).filter(rect => (
      rect.width > 0 && rect.height > 0
    ));
    if (!boxes.length) return null;
    const x = Math.min(...boxes.map(box => box.x));
    const y = Math.min(...boxes.map(box => box.y));
    const right = Math.max(...boxes.map(box => box.right));
    const bottom = Math.max(...boxes.map(box => box.bottom));
    return { x, y, right, bottom, width: right - x, height: bottom - y };
  });
}

for (const profile of PROFILES) {
  test(`action-first scene remains reachable at ${profile.id}`, async ({ page, browser }) => {
    const zoomContext = profile.zoom === 2 ? await browser.newContext({
      baseURL: "http://127.0.0.1:5190",
      viewport: {
        width: profile.viewport.width / profile.zoom,
        height: profile.viewport.height / profile.zoom
      },
      deviceScaleFactor: profile.zoom
    }) : null;
    const evidencePage = zoomContext ? await zoomContext.newPage() : page;
    if (!zoomContext) await evidencePage.setViewportSize(profile.viewport);
    await evidencePage.goto("/preview/sound-seekers-v2-content.html?stop=s1&fixture=pre-choice&density=full&motion=reduced&labels=shown&seed=11");
    await expect(evidencePage.locator("[data-gallery-ready='true']")).toBeVisible();

    const viewport = await evidencePage.evaluate(() => ({
      width: window.visualViewport?.width || window.innerWidth,
      height: window.visualViewport?.height || window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      verticalOverflow: Math.max(0, document.documentElement.scrollHeight - (window.visualViewport?.height || window.innerHeight))
    }));
    if (profile.zoom === 2) expect(viewport.devicePixelRatio).toBe(2);
    expect(viewport.horizontalOverflow).toBeLessThanOrEqual(1);
    if (profile.id === "landscape") expect(viewport.verticalOverflow).toBeLessThanOrEqual(1);

    const goal = await visibleUnion(evidencePage, "[data-scene-text], [data-scene-prompt]");
    const target = await visibleUnion(evidencePage, ".sound-seekers-world__props");
    const actors = await visibleUnion(evidencePage, ".sound-seekers-world__characters");
    const landmark = await visibleUnion(evidencePage, ".sound-seekers-landmark");
    const controls = await evidencePage.locator("[data-option-visual-id]").evaluateAll(nodes => (
      nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        };
      })
    ));
    for (const rect of [goal, target, actors, landmark, ...controls]) {
      expect(rect).not.toBeNull();
      expect(rect.x).toBeGreaterThanOrEqual(-1);
      expect(rect.y).toBeGreaterThanOrEqual(-1);
      expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(rect.bottom).toBeLessThanOrEqual(viewport.height + 1);
    }
    for (const control of controls) {
      expect(control.width).toBeGreaterThanOrEqual(56);
      expect(control.height).toBeGreaterThanOrEqual(56);
    }
    for (let index = 1; index < controls.length; index += 1) {
      const previous = controls[index - 1];
      const horizontalGap = controls[index].x - previous.right;
      const verticalGap = controls[index].y - previous.bottom;
      expect(Math.max(horizontalGap, verticalGap)).toBeGreaterThanOrEqual(8);
    }
    expect(intersects(actors, target)).toBe(false);
    expect(intersects(actors, landmark)).toBe(false);
    expect(intersects(target, landmark)).toBe(false);
    await expect(evidencePage.locator("[data-correct],[data-answer],[data-private-answer],[data-expected-token]")).toHaveCount(0);
    await zoomContext?.close();
  });
}

for (const chapter of SOUND_SEEKERS_CHAPTERS) {
  test(`ordinary and payoff compositions differ for ${chapter.id}`, async ({ page }) => {
    const stopId = chapter.stopIds.at(-1);
    const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.stopId === stopId);
    const optionId = scene.choice.options[0].visualSemanticId;
    const open = async url => {
      await page.goto(url);
      await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
      const transformation = page.locator("[data-world-transformation]");
      return {
        signature: await page.locator("[data-world-composition-signature]").getAttribute("data-world-composition-signature"),
        transformation: await transformation.count()
          ? await transformation.first().getAttribute("data-world-transformation")
          : null
      };
    };
    const ordinary = await open(`/preview/sound-seekers-v2-content.html?scene=${scene.id}&fixture=pre-choice&density=full&motion=reduced&labels=shown&seed=11`);
    const wonder = await open(`/preview/sound-seekers-v2-content.html?mode=wonder&scene=${scene.id}&fixture=boss-resolved&density=full&motion=reduced&labels=shown&seed=11&option=${encodeURIComponent(optionId)}`);
    const boss = await open(`/preview/sound-seekers-v2-content.html?scene=${scene.id}&fixture=boss-resolved&density=full&motion=reduced&labels=shown&seed=11&option=${encodeURIComponent(optionId)}`);
    expect(wonder.signature).not.toBe(ordinary.signature);
    expect(boss.signature).not.toBe(ordinary.signature);
    expect(wonder.transformation).toBeTruthy();
    expect(boss.transformation).toBeTruthy();
  });
}
