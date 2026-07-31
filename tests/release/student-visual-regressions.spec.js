import { expect, test } from "@playwright/test";

const SCREENSHOT_VIEWPORT = Object.freeze({ width: 1920, height: 1030 });

test("the whole arcade remains above the persistent navigation", async ({ page }) => {
  await page.setViewportSize(SCREENSHOT_VIEWPORT);
  await page.goto("/preview/child-surfaces.html?surface=arcade");

  const grid = page.locator(".lg-game-tilegrid");
  const tiles = grid.locator(".lg-game-tile");
  const bottomBand = page.locator(".lg-arcade-bottomband");

  await expect(tiles).toHaveCount(11);
  await expect(bottomBand).toBeVisible();

  const geometry = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect();
    const mainBox = rect(".kg-main");
    const gridBox = rect(".lg-game-tilegrid");
    const bottomBox = rect(".lg-arcade-bottomband");
    const tabBox = rect(".kg-tabbar");
    const tileState = [...document.querySelectorAll(".lg-game-tile")].map(tile => {
      const tileBox = tile.getBoundingClientRect();
      const nameBox = tile.querySelector(".lg-game-tile-name").getBoundingClientRect();
      const footBox = tile.querySelector(".lg-game-tile-foot").getBoundingClientRect();
      return {
        insideGrid: tileBox.top >= gridBox.top - 1 && tileBox.bottom <= gridBox.bottom + 1,
        nameInside: nameBox.top >= tileBox.top && nameBox.bottom <= tileBox.bottom + 1,
        footInside: footBox.top >= tileBox.top && footBox.bottom <= tileBox.bottom + 1,
        contentFits: tile.scrollHeight <= tile.clientHeight + 1
      };
    });
    return {
      bottomBandInsideMain: bottomBox.bottom <= mainBox.bottom + 1,
      gridInsideMain: gridBox.bottom <= mainBox.bottom + 1,
      mainAboveTabs: mainBox.bottom <= tabBox.top + 1,
      tileState
    };
  });

  expect(geometry.bottomBandInsideMain).toBe(true);
  expect(geometry.gridInsideMain).toBe(true);
  expect(geometry.mainAboveTabs).toBe(true);
  expect(geometry.tileState.every(tile => (
    tile.insideGrid && tile.nameInside && tile.footInside && tile.contentFits
  ))).toBe(true);
});

test("the phone arcade keeps every card in the scroll flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=arcade");
  await expect(page.locator(".lg-game-tilegrid")).toBeVisible();

  const geometry = await page.evaluate(() => {
    const grid = document.querySelector(".lg-game-tilegrid");
    const tiles = [...document.querySelectorAll(".lg-game-tile")];
    const gridBox = grid.getBoundingClientRect();
    const firstBox = tiles[0].getBoundingClientRect();
    const lastBox = tiles.at(-1).getBoundingClientRect();
    const bottomBox = document.querySelector(".lg-arcade-bottomband").getBoundingClientRect();
    return {
      bottomAfterCards: bottomBox.top >= lastBox.bottom - 1,
      gridContainsCards: gridBox.top <= firstBox.top && gridBox.bottom >= lastBox.bottom - 1,
      gridHeight: gridBox.height,
      lastCardHeight: lastBox.height
    };
  });

  expect(geometry.gridHeight).toBeGreaterThan(1000);
  expect(geometry.lastCardHeight).toBeGreaterThanOrEqual(210);
  expect(geometry.gridContainsCards).toBe(true);
  expect(geometry.bottomAfterCards).toBe(true);
});

test("the earned-coins notice is opaque and clears the navigation", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "literacyPath.guidedReadingRecords.child-surface-preview",
      JSON.stringify({ rewardPreview: { readCount: 1 } })
    );
    window.localStorage.setItem("lp-hollow-seen:child-surface-preview", "100");
  });
  await page.setViewportSize(SCREENSHOT_VIEWPORT);
  await page.goto("/preview/child-surfaces.html?surface=student-home");

  const toast = page.locator(".kid-reward-toast");
  await expect(toast).toBeVisible();
  await expect(toast).toContainText("You earned 10 coins!");
  await toast.evaluate(element => Promise.all(
    element.getAnimations().map(animation => animation.finished)
  ));

  const appearance = await page.evaluate(() => {
    const toastElement = document.querySelector(".kid-reward-toast");
    const toastBox = toastElement.getBoundingClientRect();
    const tabBox = document.querySelector(".kg-tabbar").getBoundingClientRect();
    const style = getComputedStyle(toastElement);
    return {
      background: style.backgroundColor,
      bottom: toastBox.bottom,
      clearance: tabBox.top - toastBox.bottom,
      opacity: style.opacity
    };
  });
  expect(appearance.background).toBe("rgb(255, 253, 248)");
  expect(appearance.opacity).toBe("1");
  expect(appearance.clearance).toBeGreaterThanOrEqual(8);
});

test("Sound Seekers world maps move gently and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/child-surfaces.html?surface=sound-seekers");
  await page.getByRole("button", { name: "Go to Hollow Tree" }).click();
  await page.getByRole("button", { name: "Start my adventure" }).click();
  await page.getByRole("button", { name: "Back to the map" }).click();

  const ambientPieces = page.locator(".q-map-v2-ambient > i");
  await expect(ambientPieces).toHaveCount(6);
  await expect(page.locator(".q-map-ambient-flow")).toBeVisible();

  const animationNames = await ambientPieces.evaluateAll(elements => (
    elements.map(element => getComputedStyle(element).animationName)
  ));
  expect(animationNames.every(name => name !== "none")).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => ambientPieces.evaluateAll(elements => (
    elements.map(element => getComputedStyle(element).animationName)
  ))).toEqual(["none", "none", "none", "none", "none", "none"]);
});
