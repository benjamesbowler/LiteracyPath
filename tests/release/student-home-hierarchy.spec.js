import { expect, test } from "@playwright/test";

test("A2.1 student home has one policy-led primary and six quiet, disclosed doorways", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html");

  const home = page.locator('[data-child-surface="student-home"]');
  await expect(home).toHaveAttribute("data-recommendation-policy", "student-home-next-activity");
  await expect(home).toHaveAttribute("data-recommendation-version", /^\d{4}\.\d{2}\.\d{2}$/);
  await expect(home).toHaveAttribute("data-recommendation-source", "daily-mission:quest");

  const primary = page.locator('[data-home-priority="primary"]');
  const choices = home.locator('[data-home-priority="choice"]');

  await expect(primary).toHaveCount(1);
  await expect(choices).toHaveCount(6);
  await expect(primary).toHaveAttribute("data-recommendation-source", "daily-mission:quest");
  await expect(home.getByRole("heading", { name: "Adventure Map", level: 1 })).toBeVisible();
  await expect(home.locator('[data-recommendation-explanation="child"]'))
    .toHaveText("This is your next step in today’s adventure.");
  await expect(home.locator(".kg-home-doors")).toHaveAttribute("data-choice-mode", "full");
  await expect(choices.locator(".kg-card-title")).toHaveText([
    "Adventure Map", "Books", "Story Quests", "Arcade", "Letters", "My Hollow"
  ]);

  await page.waitForFunction(() => (
    [...document.querySelectorAll('[data-child-surface="student-home"] img')]
      .every(image => image.complete && image.naturalWidth > 0)
  ));
  await expect(page.locator(".kg-stage")).toHaveScreenshot("student-home-policy-hierarchy.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01
  });

  await primary.click();
  await expect(page.locator("html")).toHaveAttribute("data-student-destination", "adventure-map");
  expect(pageErrors).toEqual([]);
});
