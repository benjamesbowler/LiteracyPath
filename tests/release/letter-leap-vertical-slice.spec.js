import { expect, test } from "@playwright/test";

test("Letter Leap production-word replay is reachable, sized for children, and follows sound state", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=1");

  const hear = page.getByRole("button", { name: "Hear the word", exact: true });
  await expect(hear).toBeVisible();
  await expect(hear).toBeEnabled();
  const box = await hear.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(56);
  expect(box?.height).toBeGreaterThanOrEqual(56);
  await hear.click();

  await page.getByRole("button", { name: "Turn game sound off", exact: true }).click();
  await expect(hear).toBeHidden();
  await page.getByRole("button", { name: "Turn game sound on", exact: true }).click();
  await expect(hear).toBeVisible();
  expect(pageErrors).toEqual([]);
});
