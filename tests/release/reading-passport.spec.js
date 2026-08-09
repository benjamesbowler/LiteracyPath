import { expect, test } from "@playwright/test";

test("Reading Passport derives completed-book stamps and saves a private text-choice reflection", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=reading-library&passport=1");
  await page.getByRole("button", { name: "Reading Passport" }).click();
  const passport = page.getByRole("main", { name: "Reading Passport" });
  await expect(passport).toContainText("not a race or leaderboard");
  await expect(passport.getByRole("heading", { name: "Book stamps" })).toBeVisible();
  await expect(passport.locator(".passport-stamps article")).toHaveCount(2);
  await expect(passport).toContainText("Read with Leda");
  const firstStamp = passport.locator(".passport-stamps article").first();
  await firstStamp.getByRole("button", { name: "I learned something" }).click();
  await expect(firstStamp.getByRole("button", { name: "I learned something" })).toHaveAttribute("aria-pressed", "true");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("lp-reading-passport:child-surface-preview")));
  const reflection = Object.values(stored.reflections)[0];
  expect(reflection.reflectionId).toBe("learn");
  expect(reflection.childMediaCollected).toBe(false);
});

test("Reading Passport has no phone overflow and all controls meet the child touch floor", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library&passport=1");
  await page.getByRole("button", { name: "Reading Passport" }).click();
  const passport = page.getByRole("main", { name: "Reading Passport" });
  const metrics = await passport.evaluate(element => ({
    overflow: element.scrollWidth - element.clientWidth,
    heights: [...element.querySelectorAll("button")].map(button => Math.round(button.getBoundingClientRect().height))
  }));
  expect(metrics.overflow).toBe(0);
  expect(Math.min(...metrics.heights)).toBeGreaterThanOrEqual(44);
});
