import { expect, test } from "@playwright/test";

test("A2.1 student home has one policy-led primary, two secondary choices, and disclosed exploration", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html");

  const home = page.locator(".lp-home-sage");
  await expect(home).toHaveAttribute("data-recommendation-policy", "student-home-next-activity");
  await expect(home).toHaveAttribute("data-recommendation-version", /^\d{4}\.\d{2}\.\d{2}$/);
  await expect(home).toHaveAttribute("data-recommendation-source", "daily-mission:quest");

  const primary = page.locator('[data-home-priority="primary"]');
  const secondary = page.locator('[data-home-priority="secondary"]');
  const explore = page.locator('[data-home-priority="explore"]');
  const more = page.locator(".hs-more-explore");

  await expect(primary).toHaveCount(1);
  await expect(secondary).toHaveCount(2);
  await expect(explore).toHaveCount(4);
  await expect(primary).toHaveAttribute("data-recommendation-source", "daily-mission:quest");
  await expect(primary.locator("h3")).toHaveText("Adventure Map");
  await expect(primary).toContainText("This is your next step in today’s adventure.");
  await expect(secondary.locator("h3")).toHaveText(["Reading Library", "Arcade"]);
  await expect(more).not.toHaveAttribute("open", "");
  await expect(explore.first()).toBeHidden();

  await page.waitForFunction(() => (
    [...document.querySelectorAll(".hs-thumb img")]
      .every(image => image.complete && image.naturalWidth > 0)
  ));
  await expect(page.locator(".hs-sheet")).toHaveScreenshot("student-home-policy-hierarchy.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01
  });

  await primary.click();
  await expect(page.locator("html")).toHaveAttribute("data-student-destination", "adventure-map");
  await more.locator("summary").click();
  await expect(more).toHaveAttribute("open", "");
  await expect(explore).toHaveCount(4);
  await expect(explore.first()).toBeVisible();
  expect(pageErrors).toEqual([]);
});
