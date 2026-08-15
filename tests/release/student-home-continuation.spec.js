import { expect, test } from "@playwright/test";

test("A2.2 continuation names the policy activity and its seeded remaining goal", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html?scenario=continuation");

  const home = page.locator('[data-child-surface="student-home"]');
  const continuation = page.locator('[data-home-priority="primary"]');

  await expect(home).toHaveAttribute(
    "data-recommendation-source",
    "daily-mission-complete:fallback"
  );
  await expect(home.getByRole("heading", { name: "The Sound Trail", level: 1 })).toBeVisible();
  await expect(continuation).toHaveAccessibleName("Continue Sound Seekers — 2 trails left");
  await expect(continuation.locator('[data-child-emphasis-cue]')).toHaveText("Play");
  await expect(continuation).toHaveAttribute("data-continuation-activity", "sound-seekers");
  await expect(continuation).toHaveAttribute("data-continuation-goal", "Sound Seekers trails");
  await expect(continuation).toHaveAttribute("data-continuation-remaining", "2");
  await expect(page.getByText("Keep playing", { exact: true })).toHaveCount(0);

  await continuation.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-student-destination",
    "sound-seekers"
  );
  expect(pageErrors).toEqual([]);
});
