import { expect, test } from "@playwright/test";

import {
  STUDENT_EMPHASIS_ROUTES,
  STUDENT_EMPHASIS_VIEWPORTS
} from "../../src/policy/studentEmphasisBudget.js";
import { expectVisibleImagesReady } from "./support/visualReadiness.js";

async function waitForPrimaryMedia(primary) {
  const image = primary.locator("img").first();
  if (await image.count() === 0) return;
  await expect(image).toBeVisible();
  await expect.poll(async () => image.evaluate(element => (
    element.complete && element.naturalWidth > 0
  ))).toBe(true);
}

for (const viewport of STUDENT_EMPHASIS_VIEWPORTS) {
  for (const route of STUDENT_EMPHASIS_ROUTES) {
    test(`A3.9 ${route.id} keeps one strongest learning action at ${viewport.id}`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(viewport);
      await page.goto(`/preview/child-surfaces.html?surface=${route.id}`);

      const surface = page.locator(`[data-child-surface="${route.id}"]`);
      const primary = surface.locator("[data-child-primary]");
      const cue = surface.locator(
        "[data-child-primary] [data-child-emphasis-cue],"
        + "[data-child-primary][data-child-emphasis-cue]"
      );

      await expect(surface).toBeVisible();
      await expect(primary).toHaveCount(1);
      await expect(primary).toBeVisible();
      await expect(primary).toHaveAttribute("data-child-emphasis", "primary");
      await expect(cue).toHaveCount(1);
      await expect(cue).toBeVisible();
      await expect(cue).toContainText(new RegExp(route.primaryCue, "i"));

      const hierarchy = await surface.evaluate(element => {
        const actions = [...element.querySelectorAll("button, a")];
        const primaryAction = element.querySelector("[data-child-primary]");
        const cueElement = primaryAction?.matches("[data-child-emphasis-cue]")
          ? primaryAction
          : primaryAction?.querySelector("[data-child-emphasis-cue]");
        const level = action => Number.parseInt(
          getComputedStyle(action).getPropertyValue("--child-emphasis-level"),
          10
        ) || 0;
        const box = primaryAction?.getBoundingClientRect();
        const cueBox = cueElement?.getBoundingClientRect();
        const intersectsViewport = rect => Boolean(rect
          && rect.bottom > 0
          && rect.top < window.innerHeight
          && rect.right > 0
          && rect.left < window.innerWidth);
        return {
          primaryLevel: primaryAction ? level(primaryAction) : 0,
          competingTierThree: actions.filter(action => action !== primaryAction && level(action) >= 3).length,
          primaryInViewport: Boolean(box
            && box.width >= 44
            && box.height >= 44
            && intersectsViewport(box)),
          cueInViewport: Boolean(cueBox
            && cueBox.top >= 0
            && cueBox.bottom <= window.innerHeight
            && cueBox.left >= 0
            && cueBox.right <= window.innerWidth)
        };
      });

      expect(hierarchy).toEqual({
        primaryLevel: 3,
        competingTierThree: 0,
        primaryInViewport: true,
        cueInViewport: true
      });
      await waitForPrimaryMedia(primary);
      await expectVisibleImagesReady(page, `${route.id} ${viewport.id} emphasis screenshot`);
      await expect(page).toHaveScreenshot(
        `student-emphasis-${route.id}-${viewport.id}.png`,
        {
          animations: "disabled",
          caret: "hide",
          fullPage: false,
          maxDiffPixelRatio: 0.01
        }
      );
      expect(pageErrors).toEqual([]);
    });
  }
}

test("A3.9 My Hollow keeps its instruction clear of World on compact portrait phones", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=my-hollow");

  const surface = page.locator('[data-child-surface="my-hollow"]');
  const instruction = surface.locator(".hollow-room-hint[data-child-instruction]");
  const world = surface.locator(".hollow-world-button");
  const room = surface.locator(".hollow-room");

  for (const width of [320, 390, 400]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(surface).toBeVisible();
    await expect(room).toBeVisible();
    await expect(instruction).toBeVisible();
    await expect(world).toBeVisible();

    const geometry = await surface.evaluate(element => {
      const bounds = selector => {
        const rect = element.querySelector(selector)?.getBoundingClientRect();
        return rect ? {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom
        } : null;
      };
      const instructionBox = bounds(".hollow-room-hint[data-child-instruction]");
      const worldBox = bounds(".hollow-world-button");
      const roomBox = bounds(".hollow-room");
      const overlapWidth = Math.max(
        0,
        Math.min(instructionBox.right, worldBox.right)
          - Math.max(instructionBox.left, worldBox.left)
      );
      const overlapHeight = Math.max(
        0,
        Math.min(instructionBox.bottom, worldBox.bottom)
          - Math.max(instructionBox.top, worldBox.top)
      );
      return {
        instruction: instructionBox,
        world: worldBox,
        room: roomBox,
        overlapArea: overlapWidth * overlapHeight,
        instructionContained: instructionBox.left >= roomBox.left - 1
          && instructionBox.top >= roomBox.top - 1
          && instructionBox.right <= roomBox.right + 1
          && instructionBox.bottom <= roomBox.bottom + 1
      };
    });

    expect(
      geometry.overlapArea,
      `${width}px My Hollow keeps its instruction out of the World action: ${JSON.stringify(geometry)}`
    ).toBe(0);
    expect(
      geometry.instructionContained,
      `${width}px My Hollow keeps its instruction inside the room: ${JSON.stringify(geometry)}`
    ).toBe(true);
  }
});

test("A3.9 Phonics keeps its phone recommendation cue clear of status decoration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=phonics");

  const primary = page.locator('[data-child-surface="phonics"] [data-child-primary]');
  const cue = primary.locator(".phonics-letter-next");
  await expect(primary).toBeVisible();
  await expect(cue).toHaveText("Start here");
  await page.evaluate(() => document.fonts?.ready);

  const geometry = await primary.evaluate(card => {
    const cardBox = card.getBoundingClientRect();
    const cueNode = card.querySelector(".phonics-letter-next");
    const statusNode = card.querySelector(".phonics-letter-status");
    const cueBox = cueNode.getBoundingClientRect();
    const statusBox = statusNode.getBoundingClientRect();
    const statusStyle = getComputedStyle(statusNode);
    const statusVisible = statusStyle.display !== "none"
      && statusStyle.visibility !== "hidden"
      && statusBox.width >= 1
      && statusBox.height >= 1;
    const intersectionWidth = statusVisible
      ? Math.max(0, Math.min(cueBox.right, statusBox.right) - Math.max(cueBox.left, statusBox.left))
      : 0;
    const intersectionHeight = statusVisible
      ? Math.max(0, Math.min(cueBox.bottom, statusBox.bottom) - Math.max(cueBox.top, statusBox.top))
      : 0;
    return {
      cueContained: cueBox.left >= cardBox.left - 1
        && cueBox.top >= cardBox.top - 1
        && cueBox.right <= cardBox.right + 1
        && cueBox.bottom <= cardBox.bottom + 1,
      overlapArea: intersectionWidth * intersectionHeight,
      card: { left: cardBox.left, top: cardBox.top, right: cardBox.right, bottom: cardBox.bottom },
      cue: { left: cueBox.left, top: cueBox.top, right: cueBox.right, bottom: cueBox.bottom },
      status: statusVisible
        ? { left: statusBox.left, top: statusBox.top, right: statusBox.right, bottom: statusBox.bottom }
        : null
    };
  });

  expect(
    geometry.cueContained,
    `Phonics keeps the complete Start here cue inside its recommended letter: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.overlapArea,
    `Phonics keeps status decoration off its Start here cue: ${JSON.stringify(geometry)}`
  ).toBe(0);
});
