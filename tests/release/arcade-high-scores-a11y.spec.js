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

test("anonymous try mode keeps local Arcade progress but removes the unavailable leaderboard", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Try for free", exact: true }).click();
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.getByRole("button", { name: "Games", exact: true }).click();

  await expect(page.locator(".student-surface-arcade")).toBeVisible();
  await expect(page.locator(".lg-arcade-bottomband")).toBeVisible();
  await expect(page.locator(".lg-arcade-points")).toBeVisible();
  await expect(page.locator(".lg-arcade-highscores")).toHaveCount(0);
  await expect(page.locator("#lg-arcade-high-scores")).toHaveCount(0);
  await expect(page.getByRole("status", { name: "High scores status" })).toHaveCount(0);
});

test("the canonical Arcade preview is an authorized child and unavailable is explicit", async ({ page }) => {
  const liveLeaderboardRequests = [];
  page.on("request", request => {
    if (request.url().includes("/rpc/get_game_leaderboard")) {
      liveLeaderboardRequests.push(request.url());
    }
  });
  await page.goto(HIGH_SCORES.url, { waitUntil: "domcontentloaded" });

  await expect(page.locator('[data-preview-surface="arcade"]')).toBeVisible();
  expect(await page.evaluate(() => (
    JSON.parse(window.localStorage.getItem("lp-student-session-v1"))
  )?.token)).toBe(PREVIEW_TOKEN);
  const trigger = page.locator(".lg-arcade-highscores");
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("status", { name: "High scores status" }))
    .toHaveText("High scores shown. 5 scores loaded.");
  expect(liveLeaderboardRequests).toEqual([]);

  await page.goto(`${HIGH_SCORES.url}&leaderboard=unavailable`, {
    waitUntil: "domcontentloaded"
  });

  await expect(page.locator('[data-preview-surface="arcade"]')).toBeVisible();
  await expect(page.locator(".lg-arcade-bottomband")).toBeVisible();
  await expect(page.locator(".lg-arcade-highscores")).toHaveCount(0);
  await expect(page.locator("#lg-arcade-high-scores")).toHaveCount(0);
  await expect(page.getByRole("status", { name: "High scores status" })).toHaveCount(0);
  expect(await page.evaluate(() => window.localStorage.getItem("lp-student-session-v1"))).toBeNull();
  expect(liveLeaderboardRequests).toEqual([]);
});

test("Arcade High Scores and its opened panel stay in the initial 568 by 320 child pane", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await seedStudentSession(page);
  await page.goto(`${HIGH_SCORES.url}&leaderboard=populated`, {
    waitUntil: "domcontentloaded"
  });

  const trigger = page.locator(".lg-arcade-highscores");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAccessibleName(HIGH_SCORES.triggerName);

  const geometry = await trigger.evaluate(element => {
    const button = element.getBoundingClientRect();
    const banner = element.closest(".lg-arcade-bottomband").getBoundingClientRect();
    const mainElement = element.closest(".kg-main");
    const main = mainElement.getBoundingClientRect();
    return {
      button: { left: button.left, right: button.right, top: button.top, bottom: button.bottom, width: button.width, height: button.height },
      banner: { left: banner.left, right: banner.right, top: banner.top, bottom: banner.bottom },
      main: {
        clientHeight: mainElement.clientHeight,
        left: main.left,
        right: main.right,
        scrollHeight: mainElement.scrollHeight,
        top: main.top,
        bottom: main.bottom
      },
      mainScrollTop: mainElement.scrollTop
    };
  });
  expect(geometry.button.width).toBeGreaterThanOrEqual(55.5);
  expect(geometry.button.height).toBeGreaterThanOrEqual(55.5);
  expect(geometry.mainScrollTop).toBe(0);
  expect(geometry.main.scrollHeight).toBeLessThanOrEqual(geometry.main.clientHeight + 1);
  expect(geometry.button.left).toBeGreaterThanOrEqual(geometry.main.left);
  expect(geometry.button.right).toBeLessThanOrEqual(geometry.main.right);
  expect(geometry.button.top).toBeGreaterThanOrEqual(geometry.main.top);
  expect(geometry.button.bottom).toBeLessThanOrEqual(geometry.main.bottom);
  expect(geometry.banner.left).toBeGreaterThanOrEqual(geometry.main.left);
  expect(geometry.banner.right).toBeLessThanOrEqual(geometry.main.right);
  expect(geometry.banner.top).toBeGreaterThanOrEqual(geometry.main.top);
  expect(geometry.banner.bottom).toBeLessThanOrEqual(geometry.main.bottom);

  await trigger.click();
  const region = page.getByRole("region", { name: HIGH_SCORES.regionName, exact: true });
  await expect(page.getByRole("status", { name: "High scores status" }))
    .toHaveText("High scores shown. 5 scores loaded.");
  const openedGeometry = await region.evaluate(element => {
    const panel = element.getBoundingClientRect();
    const mainElement = element.closest(".kg-main");
    const main = mainElement.getBoundingClientRect();
    const close = element.querySelector(".lg-leaderboard-close").getBoundingClientRect();
    return {
      closeHeight: close.height,
      main: { top: main.top, bottom: main.bottom },
      mainScrollTop: mainElement.scrollTop,
      panel: { top: panel.top, bottom: panel.bottom },
      panelClientHeight: element.clientHeight,
      panelScrollHeight: element.scrollHeight
    };
  });
  expect(openedGeometry.mainScrollTop).toBe(0);
  expect(openedGeometry.panel.top).toBeGreaterThanOrEqual(openedGeometry.main.top);
  expect(openedGeometry.panel.bottom).toBeLessThanOrEqual(openedGeometry.main.bottom);
  expect(openedGeometry.panelScrollHeight).toBeGreaterThan(openedGeometry.panelClientHeight);
  expect(openedGeometry.closeHeight).toBeGreaterThanOrEqual(55.5);

  await page.getByRole("button", { name: "Close High Scores", exact: true }).click();
  const shelfScroller = page.locator(".lg-arcade-scrollbody");
  const lastTile = page.locator(".lg-game-tile").last();
  const shelf = await shelfScroller.evaluate(element => ({
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
    scrollHeight: element.scrollHeight
  }));
  expect(shelf.scrollHeight).toBeGreaterThan(shelf.clientHeight);
  expect(["auto", "scroll"]).toContain(shelf.overflowY);
  await shelfScroller.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });
  const scrolledGeometry = await page.evaluate(() => {
    const main = document.querySelector(".kg-main").getBoundingClientRect();
    const banner = document.querySelector(".lg-arcade-bottomband").getBoundingClientRect();
    const shelf = document.querySelector(".lg-arcade-scrollbody").getBoundingClientRect();
    const trigger = document.querySelector(".lg-arcade-highscores").getBoundingClientRect();
    const tile = [...document.querySelectorAll(".lg-game-tile")].at(-1).getBoundingClientRect();
    return {
      banner: { top: banner.top, bottom: banner.bottom },
      main: { top: main.top, bottom: main.bottom },
      shelf: { top: shelf.top, bottom: shelf.bottom },
      tile: { top: tile.top, bottom: tile.bottom },
      trigger: { top: trigger.top, bottom: trigger.bottom }
    };
  });
  await expect(lastTile).toBeVisible();
  expect(scrolledGeometry.banner.top).toBeGreaterThanOrEqual(scrolledGeometry.main.top);
  expect(scrolledGeometry.banner.bottom).toBeLessThanOrEqual(scrolledGeometry.main.bottom);
  expect(scrolledGeometry.trigger.top).toBeGreaterThanOrEqual(scrolledGeometry.main.top);
  expect(scrolledGeometry.trigger.bottom).toBeLessThanOrEqual(scrolledGeometry.main.bottom);
  expect(scrolledGeometry.shelf.bottom).toBeLessThanOrEqual(scrolledGeometry.banner.top);
  expect(scrolledGeometry.tile.top).toBeGreaterThanOrEqual(scrolledGeometry.shelf.top);
  expect(scrolledGeometry.tile.bottom).toBeLessThanOrEqual(scrolledGeometry.shelf.bottom);
});

test("every Arcade tile keeps legible artwork in both wide child shells", async ({ page }) => {
  await seedStudentSession(page);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1470, height: 775 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${HIGH_SCORES.url}&leaderboard=populated`, {
      waitUntil: "domcontentloaded"
    });
    await expect(page.locator(".lg-game-tile").first()).toBeVisible();
    await expect(page.locator(".lg-arcade-highscores")).toBeVisible();

    const geometry = await page.evaluate(() => {
      const main = document.querySelector(".kg-main").getBoundingClientRect();
      const route = document.querySelector(".student-surface-arcade").getBoundingClientRect();
      const grid = document.querySelector(".lg-game-tilegrid").getBoundingClientRect();
      const banner = document.querySelector(".lg-arcade-bottomband").getBoundingClientRect();
      const trigger = document.querySelector(".lg-arcade-highscores").getBoundingClientRect();
      const tiles = [...document.querySelectorAll(".lg-game-tile")];
      const arts = [...document.querySelectorAll(".lg-game-tile-art")];
      const rowTops = [...new Set(tiles.map(tile => Math.round(tile.getBoundingClientRect().top)))];
      const artHeights = arts.map(art => art.getBoundingClientRect().height);
      const tileHeights = tiles.map(tile => tile.getBoundingClientRect().height);
      return {
        artHeightSpread: Math.max(...artHeights) - Math.min(...artHeights),
        artMinHeight: Math.min(...artHeights),
        bannerInsideMain: banner.top >= main.top - 1 && banner.bottom <= main.bottom + 1,
        gridAboveBanner: grid.bottom <= banner.top + 1,
        gridInsideMain: grid.top >= main.top - 1 && grid.bottom <= main.bottom + 1,
        routeInsideMain: route.top >= main.top - 1 && route.bottom <= main.bottom + 1,
        targetHeight: trigger.height,
        targetWidth: trigger.width,
        rowCount: rowTops.length,
        tileHeightSpread: Math.max(...tileHeights) - Math.min(...tileHeights),
        tileMinHeight: Math.min(...tileHeights),
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
    }, JSON.stringify({ viewport, ...geometry })).toEqual({
      bannerInsideMain: true,
      gridAboveBanner: true,
      gridInsideMain: true,
      routeInsideMain: true,
      tilesFit: true
    });
    expect(geometry.rowCount, JSON.stringify({ viewport, ...geometry })).toBe(2);
    expect(geometry.artHeightSpread, JSON.stringify({ viewport, ...geometry })).toBeLessThanOrEqual(1);
    expect(geometry.tileHeightSpread, JSON.stringify({ viewport, ...geometry })).toBeLessThanOrEqual(1);
    expect(geometry.artMinHeight, JSON.stringify({ viewport, ...geometry })).toBeGreaterThanOrEqual(80);
    expect(geometry.tileMinHeight, JSON.stringify({ viewport, ...geometry })).toBeGreaterThanOrEqual(140);
    expect(geometry.targetHeight).toBeGreaterThanOrEqual(55.5);
    expect(geometry.targetWidth).toBeGreaterThanOrEqual(55.5);
  }
});
