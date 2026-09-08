import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
});

test("Word Magic models a change before offering authored picture choices", async ({ page }) => {
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=3");
  await page.getByRole("button", { name: "at word nest", exact: true }).click();

  await expect(page.getByRole("button", { name: "Change to b", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Change to b", exact: true }).click();
  await expect(page.getByRole("button", { name: "Change to h", exact: true })).toBeEnabled();
  await expect(page.locator(".cvc-magic-choice")).toHaveCount(2);

  await page.getByRole("button", { name: "Change to c", exact: true }).click();
  await expect(page.locator(".cvc-magic-feedback")).toContainText("different target");
  await expect(page.getByRole("button", { name: "Change to h", exact: true })).toBeEnabled();

  await page.getByRole("button", { name: "Change to h", exact: true }).click();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Nest Built!", { exact: true })).toBeVisible();
});

test("Match corrections keep a wrong picture retryable", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=phonics&step=3");
  await page.getByRole("button", { name: /^Letter A(?:,|$)/ }).click();
  const wrong = page.getByRole("button", { name: "Word tile: dog", exact: true });
  await wrong.click();
  await expect(page.locator(".phonics-match-hint")).toContainText("starts with D");
  await expect(wrong).toBeEnabled();
  await wrong.click();
  await expect(page.locator(".phonics-match-hint")).toContainText("starts with D");
});
