import { expect, test } from "@playwright/test";

test("Resources exposes the complete feature directory and Press image packs", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=resources");
  const directory = page.getByRole("region", { name: "Where the other new features live" });
  await expect(directory).toBeVisible();
  for (const feature of ["Class Quest Live", "Paper-to-Progress", "Observed Change", "Misconception Detective", "Reading Passport", "Buddy Reading", "Transfer Missions", "Story Crew"]) {
    await expect(directory.getByRole("heading", { name: feature, exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Open Decodable Press", exact: true }).click();
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Included picture packs", exact: true })).toBeVisible();
  await expect(page.locator(".press-asset-pack-grid img")).toHaveCount(9);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
