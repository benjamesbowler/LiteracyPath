import { expect, test } from "@playwright/test";

test("CVC failed recordings preserve completion and supported evidence through every step", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=1");
  await page.getByRole("button", { name: "at word nest", exact: true }).click();
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "Sound out the word", exact: true }).click();
    await page.getByRole("button", { name: "Continue with support", exact: true }).click();
  }
  await expect(page.locator(".cvc-build-step")).toBeVisible();
  await page.getByRole("button", { name: "Use d", exact: true }).click();
  await expect(page.locator(".cvc-socket.filled")).toHaveCount(0);
  for (const word of ["cat", "bat", "hat"]) {
    for (const letter of word) await page.getByRole("button", { name: `Use ${letter}`, exact: true }).first().click();
    await page.getByRole("button", { name: word === "hat" ? "Continue" : "Next Word", exact: true }).click();
  }
  await expect(page.locator(".cvc-magic-step")).toBeVisible();
  // The existing teaching tile continuously animates; it never becomes stable.
  for (const letter of ["b", "h"]) {
    const tile = page.getByRole("button", { name: `Change to ${letter}`, exact: true });
    await expect(tile).toBeEnabled();
    await tile.click({ force: true });
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Nest Built!", { exact: true })).toBeVisible();
  const completion = await page.evaluate(() => JSON.parse(localStorage.getItem("lp_cvc_progress_child-surface-preview"))?.at?.completions?.at(-1));
  expect(completion.steps.map(step => step.step)).toEqual(["hear", "build", "magic"]);
  expect(completion.steps.every(step => step.independent === false)).toBe(true);
  expect(completion.steps[0].audioDelivery).toBe("unavailable");
  expect(completion.steps[1].firstResponse.selected).toBe("d");
  expect(completion.steps[1].supportUsed).toContain("correction");
});

test("CVC recording retry recovers, mute stays supported, and navigation cancels sound-out", async ({ page }) => {
  test.setTimeout(90000);
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=1");
  await page.getByRole("button", { name: "at word nest", exact: true }).click();
  const soundOut = page.getByRole("button", { name: "Sound out the word", exact: true });
  await soundOut.click();
  await expect(page.getByRole("button", { name: "Continue with support", exact: true })).toBeVisible();
  const header = await page.locator(".phonics-flow-header").boundingBox();
  const heading = await page.getByRole("heading", { name: "Listen to the Word", exact: true }).boundingBox();
  expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height);
  expect(await soundOut.evaluate(button => {
    const rect = button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  })).toBe(true);
  await page.unroute("**/*.mp3");
  await soundOut.click();
  await expect(page.getByRole("button", { name: "Next Word", exact: true })).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => window.Howler.mute(true));
  await soundOut.click();
  await expect(page.getByRole("button", { name: "Continue with support", exact: true })).toBeVisible();
  await page.evaluate(() => window.Howler.mute(false));
  await soundOut.click();
  await page.getByRole("button", { name: "Back to words", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Word Workshop", exact: true })).toBeVisible();
  // Exceed the 90ms sequence gap and 350ms mount cue: neither may restart.
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.Howler._howls.some(howl => howl.playing()))).toBe(false);
  await expect(page.locator(".cvc-hear-step")).toHaveCount(0);
  await expect(page.getByText("Nest Built!", { exact: true })).toHaveCount(0);
});
