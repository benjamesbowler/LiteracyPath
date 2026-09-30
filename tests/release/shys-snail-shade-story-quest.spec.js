import { expect, test } from "@playwright/test";

test("Shy's snail routes preserve materials, audible choices and the ending illustration", async ({ page }) => {
  const runtimeErrors = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.getByRole("button", { name: "Dino", exact: true }).click();
  const card = page.locator(".kg-quest-open").filter({ hasText: "Shy’s Snail Trail" });
  await expect(card.locator("img")).toHaveAttribute("src", /covers\/shy-snail-trail\.webp/);
  await card.click();
  const reader = page.locator(".story-quest-reader");
  await expect(reader).toHaveAttribute("data-page-id", "p01_start");
  await expect(reader.locator(".story-quest-audio-button")).toBeEnabled();
  await reader.getByRole("button", { name: "Hear choice: Offer a leaf", exact: true }).click();
  await expect(reader).toHaveAttribute("data-page-id", "p01_start");
  await reader.getByRole("button", { name: "Offer a leaf", exact: true }).click();
  await expect(reader).toContainText("The leaf tips under the snail.");
  await reader.getByRole("button", { name: "Lay damp moss", exact: true }).click();
  for (const next of ["p04_moss_dots", "p04_moss_strip", "p05_moss", "p06_fern_ending"]) {
    await reader.getByRole("button", { name: "Next", exact: true }).click();
    await expect(reader).toHaveAttribute("data-page-id", next);
  }
  await expect(reader).toContainText("One feeler peeks past Shy’s foot.");
  await expect(reader.locator(".story-quest-position")).toHaveText("Scene 7");
  const endingImage = await reader.locator(".story-quest-image").getAttribute("src");
  await reader.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(reader.locator(".story-quest-position")).toHaveText("The end");
  await expect(reader.locator(".story-quest-image")).toHaveAttribute("src", endingImage);
  await expect(reader).toContainText("One feeler peeks past Shy’s foot.");
  await reader.getByRole("button", { name: "Read again", exact: true }).click();
  await expect(reader).toHaveAttribute("data-page-id", "p01_start");
  await reader.getByRole("button", { name: "Lay a twig", exact: true }).click();
  await reader.getByRole("button", { name: "Lay flat bark", exact: true }).click();
  for (const next of ["p04_bark_steps", "p05_bark", "p06_log_ending"]) {
    await reader.getByRole("button", { name: "Next", exact: true }).click();
    await expect(reader).toHaveAttribute("data-page-id", next);
  }
  await expect(reader).toContainText("The snail rests in the log.");
  await expect(reader.locator(".story-quest-position")).toHaveText("Scene 6");
  expect(runtimeErrors).toEqual([]);
});
