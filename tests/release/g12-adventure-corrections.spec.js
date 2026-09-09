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
    const scene = page.locator(".river-rescue-scene");
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
    await expect(page.getByRole("button", { name: "Finish", exact: true })).toBeVisible();
    const arrival = await page.evaluate(() => {
      const friend = document.querySelector('[data-anchor="friend"]')?.getBoundingClientRect();
      const door = document.querySelector('[data-anchor="door"]')?.getBoundingClientRect();
      return { friend, door };
    });
    expect(arrival.friend).not.toBeNull();
    expect(arrival.door).not.toBeNull();
    expect(arrival.friend.x + (arrival.friend.width / 2)).toBeGreaterThanOrEqual(arrival.door.x);
    expect(arrival.friend.x + (arrival.friend.width / 2)).toBeLessThanOrEqual(arrival.door.right);
    expect(arrival.friend.bottom).toBeLessThanOrEqual(arrival.door.bottom + 1);
    await page.getByRole("button", { name: "Finish", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Word Rescue complete!", exact: true })).toBeVisible();
  }
});

test("Word Rescue resumes known progress, then Start over clears the route", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => window.localStorage.setItem("lp-arcade-onboarded-v1:word-rescue", "1"));
  await page.goto("/preview/game-overlay.html?game=word-rescue&difficulty=easy&sound=0&music=0&resume=1");
  const resume = page.getByRole("alertdialog");
  await expect(resume).toBeVisible();
  await resume.getByRole("button", { name: "Continue", exact: true }).click();
  const scene = page.locator(".river-rescue-scene");
  await expect(scene).toHaveAttribute("data-known-completed", "1");
  await expect(scene).toHaveAttribute("data-progress", "0.1667");

  await page.goto("/preview/game-overlay.html?game=word-rescue&difficulty=easy&sound=0&music=0&resume=1");
  await page.getByRole("alertdialog").getByRole("button", { name: "Start over", exact: true }).click();
  await expect(page.locator(".river-rescue-scene")).toHaveAttribute("data-known-completed", "0");
  await expect(page.locator(".river-rescue-scene")).toHaveAttribute("data-progress", "0.0000");
});

test("Sound Sort keeps its route paused and settles at the bin under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openGame(page, "sound-sort-factory", "easy");
  const scene = page.locator(".word-conveyor-scene");
  const item = scene.locator('[data-anchor="item"]');
  const bins = scene.locator('[data-anchor="bin-endpoint"]');
  const word = (await item.textContent()).trim().toLowerCase();
  const labels = await bins.evaluateAll(elements => elements.map(element => element.getAttribute("data-bin").toLowerCase()));
  const correctIndex = labels.reduce((best, label, index) => word.startsWith(label) && label.length > (labels[best] || "").length ? index : best, -1);
  await bins.nth(correctIndex).click();
  await expect(scene).toHaveAttribute("data-motion", "correct");
  await page.waitForTimeout(80);
  const distance = await page.evaluate(targetIndex => {
    const item = document.querySelector('[data-anchor="item"]').getBoundingClientRect();
    const bin = document.querySelectorAll('[data-anchor="bin-endpoint"]')[targetIndex].getBoundingClientRect();
    return { item, bin };
  }, correctIndex);
  expect(Math.abs((distance.item.x + distance.item.width / 2) - (distance.bin.x + distance.bin.width / 2))).toBeLessThan(28);
  expect(Math.abs((distance.item.y + distance.item.height / 2) - (distance.bin.y + distance.bin.height / 2))).toBeLessThan(65);
});

test("Sound Sort pauses an in-flight route until the child resumes", async ({ page }) => {
  await openGame(page, "sound-sort-factory", "easy");
  const scene = page.locator(".word-conveyor-scene");
  const item = scene.locator('[data-anchor="item"]');
  const bins = scene.locator('[data-anchor="bin-endpoint"]');
  const word = (await item.textContent()).trim().toLowerCase();
  const labels = await bins.evaluateAll(elements => elements.map(element => element.getAttribute("data-bin").toLowerCase()));
  const correctIndex = labels.reduce((best, label, index) => word.startsWith(label) && label.length > (labels[best] || "").length ? index : best, -1);
  await bins.nth(correctIndex).click();
  await expect(scene).toHaveAttribute("data-motion", "correct");
  await page.getByRole("button", { name: "Close Sound Sort Factory", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.waitForTimeout(900);
  await expect(scene).toHaveAttribute("data-motion", "correct");
  await page.getByRole("alertdialog").getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect.poll(() => scene.getAttribute("data-motion")).toBe("idle", { timeout: 2_000 });
  await expect(item).not.toHaveText(word);
});

test("Sound Sort uses fixed native bin endpoints and a rejected route before retry", async ({ page }) => {
  test.setTimeout(90_000);
  for (const difficulty of DIFFICULTIES) {
    await openGame(page, "sound-sort-factory", difficulty);
    const scene = page.locator(".word-conveyor-scene");
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
    await page.getByRole("button", { name: "Finish", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Sound Sort Factory complete!", exact: true })).toBeVisible();
  }
});
