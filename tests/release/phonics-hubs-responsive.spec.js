import { expect, test } from "@playwright/test";

const SHORT_PHONE_LANDSCAPE = Object.freeze({ width: 568, height: 320 });

async function chromeTargetHeights(page) {
  return page.evaluate(() => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    };
    return [...document.querySelectorAll(
      ".kg-header button, .kg-header [role='button'], .kg-tabbar button"
    )].filter(visible).map(element => ({
      label: element.getAttribute("aria-label") || element.textContent.trim(),
      height: element.getBoundingClientRect().height
    }));
  });
}

test("Adventure Map keeps its sole forward action above the fold on a short phone", async ({ page }) => {
  await page.setViewportSize(SHORT_PHONE_LANDSCAPE);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map", {
    waitUntil: "domcontentloaded"
  });

  const primary = page.locator(".kg-map-card--next");
  await expect(primary).toBeVisible();
  await expect(page.locator("[data-child-primary]")).toHaveCount(1);

  const geometry = await page.evaluate(() => {
    const main = document.querySelector(".kg-main");
    const scene = document.querySelector(".kg-map-scene");
    const primary = document.querySelector(".kg-map-card--next");
    const mainBox = main.getBoundingClientRect();
    const sceneBox = scene.getBoundingClientRect();
    const primaryBox = primary.getBoundingClientRect();
    return {
      mainOverflow: main.scrollHeight - main.clientHeight,
      scrimBackground: getComputedStyle(scene, "::after").backgroundImage,
      primaryInsideMain: primaryBox.top >= mainBox.top - 1
        && primaryBox.bottom <= mainBox.bottom + 1,
      sceneInsideMain: sceneBox.top >= mainBox.top - 1
        && sceneBox.bottom <= mainBox.bottom + 1,
      sceneHasMaterialSize: sceneBox.width >= 300 && sceneBox.height >= 160
    };
  });

  expect(geometry, JSON.stringify(geometry)).toEqual({
    mainOverflow: 0,
    scrimBackground: "linear-gradient(rgba(18, 44, 38, 0.06), rgba(18, 44, 38, 0.14))",
    primaryInsideMain: true,
    sceneInsideMain: true,
    sceneHasMaterialSize: true
  });

  const targets = await chromeTargetHeights(page);
  expect(targets.length).toBeGreaterThan(0);
  expect(Math.min(...targets.map(target => target.height))).toBeGreaterThanOrEqual(55.5);
});

test("Cycle chooser exposes all stations on one visible short-phone scroll lane", async ({ page }) => {
  await page.setViewportSize(SHORT_PHONE_LANDSCAPE);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1", {
    waitUntil: "domcontentloaded"
  });

  const stations = page.locator(".sbq-stations .sbq-station");
  await expect(stations).toHaveCount(10);
  await expect(page.locator(".sbq-cycle-scroll-hint"))
    .toContainText("Swipe or scroll to see every station");
  await expect(page.locator("[data-child-primary]")).toHaveCount(1);

  const before = await page.locator(".sbq-stations").evaluate(element => ({
    horizontalOverflow: element.scrollWidth - element.clientWidth,
    verticalOverflow: element.scrollHeight - element.clientHeight,
    overflowX: getComputedStyle(element).overflowX,
    mainOverflow: document.querySelector(".kg-main").scrollHeight
      - document.querySelector(".kg-main").clientHeight,
    worldOverflow: document.querySelector(".sbq-cycle-world").scrollHeight
      - document.querySelector(".sbq-cycle-world").clientHeight
  }));

  expect(before.horizontalOverflow).toBeGreaterThan(100);
  expect(before.verticalOverflow).toBeLessThanOrEqual(1);
  expect(before.overflowX).toBe("auto");
  expect(before.mainOverflow).toBeLessThanOrEqual(1);
  expect(before.worldOverflow).toBeLessThanOrEqual(1);

  await stations.last().scrollIntoViewIfNeeded();
  await expect(stations.last()).toBeInViewport();
  await expect.poll(() => page.locator(".sbq-stations").evaluate(element => element.scrollLeft))
    .toBeGreaterThan(0);

  const targets = await chromeTargetHeights(page);
  expect(Math.min(...targets.map(target => target.height))).toBeGreaterThanOrEqual(55.5);
});
