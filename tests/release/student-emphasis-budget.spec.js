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
      const cue = ["cycle-practice", "phonics"].includes(route.id) ? surface.locator("[data-child-instruction]") : surface.locator(
        "[data-child-primary] [data-child-emphasis-cue],"
        + "[data-child-primary][data-child-emphasis-cue]"
      );

      await expect(surface).toBeVisible();
      await expect(primary).toHaveCount(1);
      await expect(primary).toBeVisible();
      if (route.id === "phonics") {
        // CHILD_SURFACE_RULES makes the complete free-choice alphabet its
        // primary area; no letter is promoted over the other 25 choices.
        await expect(primary).toHaveAttribute("role", "group");
        await expect(primary).toHaveAccessibleName("All 26 letters");
        await expect(primary.getByRole("button")).toHaveCount(26);
      } else await expect(primary).toHaveAttribute("data-child-emphasis", "primary");
      await expect(cue).toHaveCount(1);
      await expect(cue).toBeVisible();
      await expect(cue).toContainText(new RegExp(route.primaryCue, "i"));

      const hierarchy = await surface.evaluate((element, routeId) => {
        const actions = [...element.querySelectorAll("button, a")];
        const primaryAction = element.querySelector("[data-child-primary]");
        const cueElement = ["cycle-practice", "phonics"].includes(routeId) ? element.querySelector("[data-child-instruction]") : primaryAction?.matches("[data-child-emphasis-cue]")
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
        primaryLevel: route.id === "phonics" ? 0 : 3,
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

test("A3.9 Phonics keeps its free-choice instruction and complete alphabet clear on phones", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=phonics");
  const surface = page.locator('[data-child-surface="phonics"]');
  await expect(surface.locator('[data-child-instruction]')).toHaveText('Choose any letter to play.');
  await expect(surface.locator('[data-child-instruction]')).toBeInViewport();
  const alphabet = surface.getByRole('group', {name:'All 26 letters',exact:true});
  await expect(alphabet).toHaveAttribute('data-child-primary', '');
  const letters=alphabet.getByRole('button');await expect(letters).toHaveCount(26);
  for(let index=0;index<26;index++) {
    const letter=letters.nth(index);await expect(letter).toBeEnabled();await letter.scrollIntoViewIfNeeded();
    await expect(letter).toBeInViewport();
    const box=await letter.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    await expect(letter).toHaveAttribute('data-child-emphasis','choice');
  }
});
