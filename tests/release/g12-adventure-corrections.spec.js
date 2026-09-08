import { expect, test } from "@playwright/test";

const DIFFICULTIES = ["easy", "medium", "hard"];

async function openGame(page, game, difficulty) {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:word-rescue", "1");
    window.localStorage.setItem("lp-arcade-onboarded-v1:sound-sort-factory", "1");
  });
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=${difficulty}&sound=0&music=0`);
}

test("Word Rescue keeps wrong retries in place and completes an anchored river route", async ({ page }) => {
  test.setTimeout(90_000);
  for (const difficulty of DIFFICULTIES) {
    await openGame(page, "word-rescue", difficulty);
    const scene = page.locator(".g12-rescue-scene");
    await expect(scene).toBeVisible();
    await expect(scene.locator('[data-bank="left"]')).toHaveCount(1);
    await expect(scene.locator('[data-bank="right"]')).toHaveCount(1);
    await expect(scene.locator('[data-anchor="bridge"]')).toHaveCount(1);
    await expect(scene.locator('[data-anchor="home"]')).toHaveCount(1);

    const firstTarget = (await page.locator(".adv-rescue > .adv-belt-item").textContent()).trim();
    await page.locator(".adv-choices button").filter({ hasNotText: firstTarget }).first().click();
    await expect(scene).toHaveAttribute("data-progress", "0.0000");
    await expect(page.locator(".adv-rescue > .adv-belt-item")).toHaveText(firstTarget);

    for (let round = 0; round < 6; round += 1) {
      const target = (await page.locator(".adv-rescue > .adv-belt-item").textContent()).trim();
      const before = Number(await page.locator('[data-anchor="friend"]').getAttribute("data-world-x"));
      await page.locator(".adv-choices").getByRole("button", { name: target, exact: true }).click();
      await expect(scene).toHaveAttribute("data-progress", `${((round + 1) / 6).toFixed(4)}`);
      expect(Number(await page.locator('[data-anchor="friend"]').getAttribute("data-world-x"))).toBeGreaterThan(before);
      if (round < 5) await expect(page.locator(".adv-rescue > .adv-belt-item")).not.toHaveText(target);
    }
    await expect(page.getByRole("heading", { name: "Word Rescue complete!", exact: true })).toBeVisible();
  }
});

test("Sound Sort uses fixed native bin endpoints and a rejected route before retry", async ({ page }) => {
  test.setTimeout(90_000);
  for (const difficulty of DIFFICULTIES) {
    await openGame(page, "sound-sort-factory", difficulty);
    const scene = page.locator(".g12-sort-scene");
    const item = scene.locator('[data-anchor="item"]');
    const bins = scene.locator('[data-anchor="bin-endpoint"]');
    await expect(scene).toBeVisible();
    await expect(bins).toHaveCount(2);
    const total = Number((await page.locator(".lg-game-header-meter").getAttribute("aria-label")).split(" of ")[1]);

    for (let round = 0; round < total; round += 1) {
      const word = (await item.textContent()).trim().toLowerCase();
      const labels = await bins.evaluateAll(elements => elements.map(element => element.getAttribute("data-bin").toLowerCase()));
      const correctIndex = labels.reduce((best, label, index) => word.startsWith(label) && label.length > (labels[best] || "").length ? index : best, -1);
      expect(correctIndex).toBeGreaterThanOrEqual(0);

      if (round === 0) {
        await bins.nth(correctIndex === 0 ? 1 : 0).click();
        await expect(scene).toHaveAttribute("data-motion", "wrong-out");
        await expect.poll(() => scene.getAttribute("data-motion")).toBe("idle");
        await expect(item).toHaveAttribute("data-world-x", "18");
        await expect(item).toHaveText(word);
      }

      await bins.nth(correctIndex).click();
      await expect(scene).toHaveAttribute("data-motion", "correct");
      if (round < total - 1) {
        await expect.poll(() => scene.getAttribute("data-motion")).toBe("idle");
        await expect(item).not.toHaveText(word);
      }
    }
    await expect(page.getByRole("heading", { name: "Sound Sort Factory complete!", exact: true })).toBeVisible();
  }
});
