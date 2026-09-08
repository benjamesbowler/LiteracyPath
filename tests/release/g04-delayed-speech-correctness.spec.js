import { expect, test } from "@playwright/test";

test("muting a wrong CVC attempt blocks its delayed retry speech", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=cvc-word-builder&sound=1&music=0");

  const player = page.getByRole("dialog", { name: "CVC Word Builder", exact: true });
  await expect(player).toBeVisible();
  const image = player.locator(".lg-game-picture img");
  await expect(image).toHaveAttribute("src", /\/([^/]+)\.(?:webp|png|jpe?g)(?:\?.*)?$/i, { timeout: 90_000 });
  const target = (await image.getAttribute("src")).match(/\/([^/]+)\.(?:webp|png|jpe?g)(?:\?.*)?$/i)[1];
  const targetLength = await player.locator(".lg-game-slots > *").count();
  const bank = player.locator(".lg-game-letter-bank button");
  const labels = await bank.allTextContents();
  const wrongIndex = labels.findIndex(letter => !target.includes(letter.trim().toLowerCase()));
  expect(wrongIndex, "the authored builder must include a distractor tile").toBeGreaterThanOrEqual(0);

  await bank.nth(wrongIndex).click();
  let chosen = 1;
  for (let index = 0; index < labels.length && chosen < targetLength; index += 1) {
    if (index === wrongIndex) continue;
    await bank.nth(index).click();
    chosen += 1;
  }

  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(page.getByRole("button", { name: "Turn spoken audio and game sounds on", exact: true })).toBeVisible();
  await expect(player.getByText("Build this word.", { exact: true })).toBeVisible();
  await page.waitForTimeout(900);
  await expect(player.locator(".lg-game-audio")).toHaveCount(0);
});
