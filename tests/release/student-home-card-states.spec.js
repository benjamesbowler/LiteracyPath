import { expect, test } from "@playwright/test";

test("A2.4 every student activity has a seeded child-safe card state", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html?scenario=card-states");

  const home = page.locator('[data-child-surface="student-home"]');
  const cards = home.locator("[data-learning-state]");
  await expect(cards).toHaveCount(7);
  await expect(home.locator("[data-learning-state-label]")).toHaveCount(3);

  const adventureMap = home.locator('[data-rail-destination="map"]');
  await expect(adventureMap).toHaveAttribute("data-learning-state", "Continue");
  await expect(adventureMap).toHaveAttribute("data-progress-marker", "1 map stop complete");

  const readingLibrary = home.locator('[data-rail-destination="books"]');
  await expect(readingLibrary).toHaveAttribute("data-learning-state", "Continue");
  await expect(readingLibrary).toHaveAttribute("data-progress-marker", "1 book read");

  const soundSeekers = home.locator('[data-continuation-activity="sound-seekers"]');
  await expect(soundSeekers).toHaveAttribute("data-learning-state", "Teacher picked");
  await expect(soundSeekers).toHaveAttribute("data-progress-marker", "38 of 40 trails");
  await expect(home.locator('[data-learning-state="New"]')).toHaveCount(4);
  await expect(home.locator("[data-child-instruction]"))
    .toHaveText("Your teacher picked this");
  await expect(home.locator("[data-learning-state-label]", { hasText: "New" }))
    .toHaveCount(0);

  const childFacingStates = await home.locator("[data-learning-state-label]").allTextContents();
  expect(childFacingStates.join(" ")).not.toMatch(
    /accuracy|high.?score|percent|%|\b\d+\s*\/\s*\d+\b|\b\d+\s+stars?\b/i
  );

  await page.waitForFunction(() => (
    [...document.querySelectorAll('[data-child-surface="student-home"] img')]
      .every(image => image.complete && image.naturalWidth > 0)
  ));
  await expect(page.locator(".kg-stage")).toHaveScreenshot("student-home-card-states.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01
  });

  await soundSeekers.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-student-destination",
    "sound-seekers"
  );
  expect(pageErrors).toEqual([]);
});
