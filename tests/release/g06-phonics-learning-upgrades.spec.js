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
  await expect(page.getByRole("group", { name: "Target word hat" })).toBeVisible();
  await expect(page.getByText("Change bat to hat. Change the first sound from b to h.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hear target hat", exact: true })).toBeVisible();
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

test("Listen follows the authored ending contract and keeps picture taps available", async ({ page }) => {
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&step=2");
  await page.getByRole("button", { name: /^Letter X(?:,|$)/ }).click();

  await expect(page.getByText("Look at each picture. The ending sound is X.", { exact: true })).toBeVisible();
  const cards = page.locator(".phonics-listen-card");
  await expect(cards).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Hear the word fox", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Hear the word fox", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "could not play" })).toBeVisible();
});

test("Build exposes a bounded supported continuation above the tab bar", async ({ page }) => {
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=1");
  await page.getByRole("button", { name: "at word nest", exact: true }).click();

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "Sound out the word", exact: true }).click();
    await page.getByRole("button", { name: "Continue with support", exact: true }).click();
  }
  await expect(page.locator(".cvc-build-step")).toBeVisible();

  for (const letter of ["c", "a", "t"]) {
    await page.getByRole("button", { name: `Use ${letter}`, exact: true }).first().click();
  }

  const nextWord = page.getByRole("button", { name: "Next Word", exact: true });
  await expect(nextWord).toBeVisible();
  const nextWordBox = await nextWord.boundingBox();
  const tabs = await page.locator(".kg-tabbar").boundingBox();
  expect((nextWordBox?.y || 0) + (nextWordBox?.height || 0)).toBeLessThanOrEqual((tabs?.y || 0) + 1);
  await expect(nextWord).toBeEnabled();
});
