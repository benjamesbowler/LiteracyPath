import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { A11Y_KEY_INTERACTIONS } from "../../src/accessibility/primaryRouteInventory.js";

const PREVIEW_TOKEN = "preview-leaderboard-token";
const HIGH_SCORES = A11Y_KEY_INTERACTIONS.find(row => row.id === "arcade-high-scores");

async function seedStudentSession(page) {
  await page.addInitScript(token => {
    window.localStorage.setItem("lp-student-session-v1", JSON.stringify({ token }));
  }, PREVIEW_TOKEN);
}

async function tabToHighScores(page, trigger) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await trigger.evaluate(element => document.activeElement === element)) return;
  }
  await expect(trigger).toBeFocused();
}

async function openArcadeHighScores(page, mode, activation = "keyboard") {
  await seedStudentSession(page);
  await page.goto(`${HIGH_SCORES.url}&leaderboard=${mode}`, {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('[data-preview-surface="arcade"]')).toBeVisible();

  const trigger = page.locator(".lg-arcade-highscores");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAccessibleName(HIGH_SCORES.triggerName);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveAttribute("aria-controls", "lg-arcade-high-scores");

  const targetSize = await trigger.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return { height: bounds.height, width: bounds.width };
  });
  expect(targetSize.height).toBeGreaterThanOrEqual(55.5);
  expect(targetSize.width).toBeGreaterThanOrEqual(55.5);

  if (activation === "pointer") {
    await trigger.click();
  } else {
    await tabToHighScores(page, trigger);
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
  }

  const region = page.getByRole("region", { name: HIGH_SCORES.regionName, exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAccessibleName("Hide High Scores");
  await expect(region).toBeVisible();
  await expect(page.getByRole("button", { name: "Close High Scores", exact: true })).toBeFocused();
  await expect(page.getByRole("status", { name: "High scores status" }))
    .toHaveText("Loading high scores.");

  return { region, trigger };
}

test("Arcade High Scores is a keyboard disclosure with an accessible five-reader ranking", async ({ page }) => {
  const status = page.getByRole("status", { name: "High scores status" });
  await seedStudentSession(page);
  await page.goto(`${HIGH_SCORES.url}&leaderboard=populated`, {
    waitUntil: "domcontentloaded"
  });

  await expect(status).toHaveText("High scores are hidden.");
  const trigger = page.locator(".lg-arcade-highscores");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAccessibleName(HIGH_SCORES.triggerName);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveAttribute("aria-controls", "lg-arcade-high-scores");
  await expect(page.locator('[data-preview-surface="arcade"] [data-child-primary]')).toHaveCount(1);
  await expect(trigger).not.toHaveAttribute("data-child-primary");

  const targetSize = await trigger.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return { height: bounds.height, width: bounds.width };
  });
  expect(targetSize.height).toBeGreaterThanOrEqual(55.5);
  expect(targetSize.width).toBeGreaterThanOrEqual(55.5);

  await tabToHighScores(page, trigger);
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");

  const region = page.getByRole("region", { name: HIGH_SCORES.regionName, exact: true });
  const close = page.getByRole("button", { name: "Close High Scores", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAccessibleName("Hide High Scores");
  await expect(region).toBeVisible();
  await expect(close).toBeFocused();
  await expect(status).toHaveText("Loading high scores.");

  const ranking = region.getByRole("list", { name: "High scores ranking" });
  const readers = ranking.getByRole("listitem");
  const readerLabels = ranking.locator(".lg-leaderboard-who strong");
  await expect(readers).toHaveCount(5);
  await expect(readerLabels).toHaveCount(5);
  for (const readerLabel of await readerLabels.all()) {
    await expect(readerLabel).toHaveText(/^Reader /);
  }
  await expect(status).toHaveText("High scores shown. 5 scores loaded.");

  const axe = await new AxeBuilder({ page }).include("#lg-arcade-high-scores").analyze();
  expect(
    axe.violations.filter(violation => violation.impact === "serious" || violation.impact === "critical")
  ).toEqual([]);

  await page.keyboard.press("Space");
  await expect(region).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(status).toHaveText("High scores are hidden.");
});

test("Arcade High Scores announces empty and failed results and still closes by pointer", async ({ page }) => {
  let state = await openArcadeHighScores(page, "empty", "pointer");
  await expect(page.getByRole("status", { name: "High scores status" }))
    .toHaveText("High scores shown. No scores yet.");
  await page.getByRole("button", { name: "Close High Scores", exact: true }).click();
  await expect(state.region).toBeHidden();
  await expect(state.trigger).toBeFocused();

  state = await openArcadeHighScores(page, "failure", "pointer");
  await expect(page.getByRole("status", { name: "High scores status" }))
    .toHaveText("High scores could not load. Try again later.");
  await page.getByRole("button", { name: "Close High Scores", exact: true }).click();
  await expect(state.region).toBeHidden();
  await expect(state.trigger).toBeFocused();
});

test("Arcade High Scores control stays reachable and unclipped at 568 by 320", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto(HIGH_SCORES.url, { waitUntil: "domcontentloaded" });

  const trigger = page.locator(".lg-arcade-highscores");
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAccessibleName(HIGH_SCORES.triggerName);

  const geometry = await trigger.evaluate(element => {
    const button = element.getBoundingClientRect();
    const banner = element.closest(".lg-arcade-bottomband").getBoundingClientRect();
    const arcade = element.closest(".lg-arcade").getBoundingClientRect();
    return {
      button: { left: button.left, right: button.right, top: button.top, bottom: button.bottom, width: button.width, height: button.height },
      banner: { left: banner.left, right: banner.right },
      arcade: { left: arcade.left, right: arcade.right },
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };
  });
  expect(geometry.button.width).toBeGreaterThanOrEqual(55.5);
  expect(geometry.button.height).toBeGreaterThanOrEqual(55.5);
  expect(geometry.button.left).toBeGreaterThanOrEqual(geometry.arcade.left);
  expect(geometry.button.right).toBeLessThanOrEqual(geometry.arcade.right);
  expect(geometry.button.top).toBeGreaterThanOrEqual(0);
  expect(geometry.button.bottom).toBeLessThanOrEqual(geometry.viewport.height);
  expect(geometry.banner.left).toBeGreaterThanOrEqual(geometry.arcade.left);
  expect(geometry.banner.right).toBeLessThanOrEqual(geometry.arcade.right);
});

test("Arcade grid and High Scores control share the bounded MacBook child shell", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 775 });
  await page.goto(HIGH_SCORES.url, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".lg-game-tile").first()).toBeVisible();
  await expect(page.locator(".lg-arcade-highscores")).toBeVisible();

  const geometry = await page.evaluate(() => {
    const main = document.querySelector(".kg-main").getBoundingClientRect();
    const route = document.querySelector(".student-surface-arcade").getBoundingClientRect();
    const grid = document.querySelector(".lg-game-tilegrid").getBoundingClientRect();
    const banner = document.querySelector(".lg-arcade-bottomband").getBoundingClientRect();
    const trigger = document.querySelector(".lg-arcade-highscores").getBoundingClientRect();
    const tiles = [...document.querySelectorAll(".lg-game-tile")];
    return {
      bannerInsideMain: banner.top >= main.top - 1 && banner.bottom <= main.bottom + 1,
      gridAboveBanner: grid.bottom <= banner.top + 1,
      gridInsideMain: grid.top >= main.top - 1 && grid.bottom <= main.bottom + 1,
      routeInsideMain: route.top >= main.top - 1 && route.bottom <= main.bottom + 1,
      targetHeight: trigger.height,
      targetWidth: trigger.width,
      tilesFit: tiles.every(tile => {
        const bounds = tile.getBoundingClientRect();
        return bounds.top >= grid.top - 1
          && bounds.bottom <= grid.bottom + 1
          && tile.scrollHeight <= tile.clientHeight + 1;
      })
    };
  });

  expect({
    bannerInsideMain: geometry.bannerInsideMain,
    gridAboveBanner: geometry.gridAboveBanner,
    gridInsideMain: geometry.gridInsideMain,
    routeInsideMain: geometry.routeInsideMain,
    tilesFit: geometry.tilesFit
  }, JSON.stringify(geometry)).toEqual({
    bannerInsideMain: true,
    gridAboveBanner: true,
    gridInsideMain: true,
    routeInsideMain: true,
    tilesFit: true
  });
  expect(geometry.targetHeight).toBeGreaterThanOrEqual(55.5);
  expect(geometry.targetWidth).toBeGreaterThanOrEqual(55.5);
});
