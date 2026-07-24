import { expect, test } from "@playwright/test";

test("A2.4 every student activity has a seeded child-safe card state", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html?scenario=card-states");

  const cards = page.locator(".hs-card[data-learning-state]");
  await expect(cards).toHaveCount(7);
  await expect(cards.locator(".hs-card-state")).toHaveCount(7);

  const adventureMap = cards.filter({ has: page.getByRole("heading", { name: "Adventure Map" }) });
  await expect(adventureMap).toHaveAttribute("data-learning-state", "Continue");
  await expect(adventureMap).toHaveAttribute("data-progress-marker", "1 map stop complete");

  const readingLibrary = cards.filter({
    has: page.getByRole("heading", { name: "Reading Library" })
  });
  await expect(readingLibrary).toHaveAttribute("data-learning-state", "Continue");
  await expect(readingLibrary).toHaveAttribute("data-progress-marker", "1 book read");

  const more = page.locator(".hs-more-explore");
  await more.locator("summary").click();

  const soundSeekers = cards.filter({
    has: page.getByRole("heading", { name: "Sound Seekers" })
  });
  await expect(soundSeekers).toHaveAttribute("data-learning-state", "Teacher picked");
  await expect(soundSeekers).toHaveAttribute("data-progress-marker", "38 of 40 trails");
  await expect(page.locator('.hs-card[data-learning-state="New"]')).toHaveCount(4);

  const childFacingStates = await cards.locator(".hs-card-state-row").allTextContents();
  expect(childFacingStates.join(" ")).not.toMatch(
    /accuracy|high.?score|percent|%|\b\d+\s*\/\s*\d+\b|\b\d+\s+stars?\b/i
  );

  await page.waitForFunction(() => (
    [...document.querySelectorAll(".hs-thumb img")]
      .every(image => image.complete && image.naturalWidth > 0)
  ));
  await expect(page.locator(".hs-sheet")).toHaveScreenshot("student-home-card-states.png", {
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
