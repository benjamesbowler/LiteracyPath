import { expect, test } from "@playwright/test";

test("teacher can see a bulk random picture-code action for only the students who need one", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/preview/teacher-a11y.html?surface=classes&students=25");

  const action = page.getByRole("button", {
    name: "Randomly assign three-picture sign-in codes to 5 students"
  });
  await expect(action).toBeVisible();
  await expect(action).toHaveText("Assign random picture codes (5)");
  await expect(action).toHaveCSS("min-height", "44px");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
