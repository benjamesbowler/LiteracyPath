import { expect, test } from "@playwright/test";

test("Resources exposes only the retained supporting feature directory", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=resources");
  const directory = page.getByRole("region", { name: "Where supporting features live" });
  await expect(directory).toBeVisible();
  for (const feature of ["Misconception Detective", "Buddy Reading", "Transfer Missions"]) {
    await expect(directory.getByRole("heading", { name: feature, exact: true })).toBeVisible();
  }
  for (const retired of ["Class Quest Live", "Paper-to-Progress", "Observed Change", "Reading Passport", "Story Crew", "Decodable Press"]) {
    await expect(page.getByText(retired, { exact: true })).toHaveCount(0);
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
