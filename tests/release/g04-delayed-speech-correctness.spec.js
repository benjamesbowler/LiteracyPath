import { expect, test } from "@playwright/test";

for (const startsMuted of [false, true]) {
test(`CVC wrong retry restores input silently when ${startsMuted ? "started muted" : "muted during feedback"}`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(`/preview/game-overlay.html?game=cvc-word-builder&sound=${startsMuted ? 0 : 1}&music=0`);

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

  await page.evaluate(() => {
    window.__g04PlayCalls = [];
    const original = window.Howl.prototype.play;
    window.Howl.prototype.play = function (...args) {
      window.__g04PlayCalls.push(this._src);
      return original.apply(this, args);
    };
  });
  await bank.nth(wrongIndex).click();
  let chosen = 1;
  for (let index = 0; index < labels.length && chosen < targetLength; index += 1) {
    if (index === wrongIndex) continue;
    await bank.nth(index).click();
    chosen += 1;
  }

  if (!startsMuted) await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await page.evaluate(() => { window.__g04PlayCalls = []; });
  await expect(page.getByRole("button", { name: "Turn spoken audio and game sounds on", exact: true })).toBeVisible();
  await expect(player.getByText("Build the word for the picture.", { exact: true })).toBeVisible();
  await page.waitForTimeout(900);
  await expect(player.locator(".lg-game-audio")).toHaveCount(0);
  await expect(player.locator(".lg-game-slots button")).toHaveCount(0);
  expect(await page.evaluate(() => window.__g04PlayCalls)).toEqual([]);
  // A muted retry must still clear the wrong construction and accept a new one.
  for (const letter of target) {
    await bank.filter({ hasText: new RegExp(`^${letter}$`, "i") }).and(page.locator("button:not(:disabled)")).first().click();
  }
  await expect(player.locator(".lg-build-blend")).toBeVisible();
  await player.locator(".lg-build-blend").click();
  await expect(player.locator(".lg-build-use")).toBeVisible();
  await player.locator(".lg-build-use").click();
  await expect(player.locator(".lg-build-continue")).toBeVisible();
  await player.locator(".lg-build-continue").click();
  await expect(player.locator(".lg-game-meter")).toHaveAttribute("aria-label", "2 of 6");
});
}
