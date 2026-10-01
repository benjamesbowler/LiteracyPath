import { expect, test } from "@playwright/test";

import {
  STUDENT_EMPHASIS_ROUTES,
  STUDENT_EMPHASIS_VIEWPORTS
} from "../../src/policy/studentEmphasisBudget.js";
import { expectVisibleImagesReady } from "./support/visualReadiness.js";
import { cycleStorageKey } from "../../src/components/cycle-practice/cyclePracticeState.js";
import { CYCLE_PRACTICE_VERSION, CYCLE_ACTIVITY_REVISION } from "../../src/policy/cyclePracticePolicy.js";

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
      if (route.id === "cycle-practice") {
        await page.addInitScript(({ key, version, revision }) => {
          localStorage.setItem(key, JSON.stringify({
            version, activityRevision: revision, mode: "practice", practiceSeed: "child-device-matrix",
            practiceIndex: 0, pass: 0, assessmentIndex: 0, assessmentRecords: [], practiceRecords: [],
            attempts: 0, pendingAttempt: null, result: null, paused: false, earnedCount: 0,
            attemptId: "synthetic-device-matrix", startedAt: "2026-09-30T00:00:00.000Z"
          }));
        }, { key: cycleStorageKey("child-surface-preview", "preview", "cycle-1"), version: CYCLE_PRACTICE_VERSION, revision: CYCLE_ACTIVITY_REVISION });
      }
      await page.goto(`/preview/child-surfaces.html?surface=${route.id}`);

      const surface = page.locator(`[data-child-surface="${route.id}"]`);
      const primary = surface.locator("[data-child-primary]");
      const cue = route.id === "cycle-practice" ? surface.locator("[data-child-instruction]") : surface.locator(
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

      const hierarchy = await surface.evaluate((element, routeId) => {
        const actions = [...element.querySelectorAll("button, a")];
        const primaryAction = element.querySelector("[data-child-primary]");
        const cueElement = routeId === "cycle-practice" ? element.querySelector("[data-child-instruction]") : primaryAction?.matches("[data-child-emphasis-cue]")
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
      }, route.id);

      expect(hierarchy).toEqual({
        primaryLevel: 3,
        competingTierThree: 0,
        primaryInViewport: true,
        cueInViewport: true
      });
      await waitForPrimaryMedia(primary);
      if (route.id === "cycle-practice") {
        const instructionAudio = surface.getByRole("button", { name: "Hear what to do", exact: true });
        await instructionAudio.click();
        await expect(instructionAudio).toHaveAttribute("data-audio-state", "ready", { timeout: 20_000 });
        await expect(surface.getByText("Your turn — tap", { exact: true })).toBeVisible({ timeout: 30000 });
      }
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

test("A3.9 My Hollow entry keeps one task and three picture choices on compact phones", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/child-surfaces.html?surface=my-hollow");
  for (const width of [320, 390, 400]) {
    await page.setViewportSize({ width, height: 844 });
    const surface = page.locator('[data-child-surface="my-hollow"]');
    await expect(surface.locator("[data-child-primary]")).toHaveCount(1);
    await expect(surface.locator(".hollow-doorways button")).toHaveCount(3);
    await expect(surface.locator(".hollow-doorways")).toBeInViewport();
    await expect(surface.locator("[data-child-instruction]")).toBeInViewport();
    await expect(surface.locator(".hollow-spot, .hollow-world-button, .hollow-tabs")).toHaveCount(0);
  }
});

test("A3.9 Phonics keeps its phone recommendation cue clear of status decoration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=phonics");

  const primary = page.locator('[data-child-surface="phonics"] [data-child-primary]');
  const cue = primary.locator("[data-child-emphasis-cue]");
  await expect(primary).toBeVisible();
  await expect(cue).toHaveText("Practise A");
  await page.evaluate(() => document.fonts?.ready);

  const geometry = await primary.evaluate(card => {
    const cardBox = card.getBoundingClientRect();
    const cueNode = card.querySelector("[data-child-emphasis-cue]");
    const statusNode = card.querySelector("small");
    const cueBox = cueNode.getBoundingClientRect();
    const statusBox = statusNode?.getBoundingClientRect();
    const statusStyle = statusNode ? getComputedStyle(statusNode) : null;
    const statusVisible = Boolean(statusStyle && statusBox) && statusStyle.display !== "none"
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
    `Phonics keeps the complete Practise cue inside its recommended letter: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.overlapArea,
    `Phonics keeps status decoration off its Practise cue: ${JSON.stringify(geometry)}`
  ).toBe(0);
});
