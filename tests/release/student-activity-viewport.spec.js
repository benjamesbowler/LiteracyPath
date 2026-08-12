import { expect, test } from "@playwright/test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { CHILD_SURFACE_ROUTES } from "../../src/policy/childSurfaceRules.js";

const IPAD_LANDSCAPE = { width: 1024, height: 768 };

const QUEST_STATIONS = [
  ["cycle-1", "letters"],
  ["cycle-1", "sounds"],
  ["cycle-1", "hunt"],
  ["cycle-1", "quick"],
  ["cycle-1", "build"],
  ["cycle-1", "play"],
  ["cycle-1", "poem"],
  ["cycle-1", "story"],
  ["cycle-1", "trace"],
  ["cycle-1", "check"],
  ["cycle-25", "pattern"],
  ["cycle-25", "chain"],
  ["cycle-25", "speed"],
  ["cycle-25", "poem"],
  ["cycle-25", "spell"],
  ["cycle-25", "check"]
];

const VISIBLE_CONTROL = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "canvas"
].join(",");

async function boundedGeometry(locator, state, { allowedVerticalScroll = [] } = {}) {
  const result = await locator.evaluate((root, { selector, allowedVerticalScroll }) => {
    const rootRect = root.getBoundingClientRect();
    const visible = [...root.querySelectorAll(selector)].filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !element.closest("details:not([open])")
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity) !== 0
        && rect.width > 0
        && rect.height > 0;
    });
    const verticalScrollers = [...root.querySelectorAll("*")].filter(element => {
      const style = getComputedStyle(element);
      return element.scrollHeight > element.clientHeight + 1
        && ["auto", "scroll"].includes(style.overflowY);
    });
    const allowedScrollAncestor = element => {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== root) {
        const style = getComputedStyle(ancestor);
        const scrolls = ancestor.scrollHeight > ancestor.clientHeight + 1
          && ["auto", "scroll"].includes(style.overflowY);
        if (scrolls) {
          return allowedVerticalScroll.some(selector => ancestor.matches(selector));
        }
        ancestor = ancestor.parentElement;
      }
      return false;
    };
    return {
      overflowX: root.scrollWidth - root.clientWidth,
      overflowY: root.scrollHeight - root.clientHeight,
      clipped: visible.filter(element => {
        const rect = element.getBoundingClientRect();
        const outside = rect.left < rootRect.left - 1
          || rect.right > rootRect.right + 1
          || rect.top < rootRect.top - 1
          || rect.bottom > rootRect.bottom + 1;
        return outside && !allowedScrollAncestor(element);
      }).map(element => ({
        label: element.getAttribute("aria-label") || element.textContent?.trim() || element.tagName,
        rect: element.getBoundingClientRect().toJSON()
      })),
      unexpectedVerticalScrollers: verticalScrollers
        .filter(element => !allowedVerticalScroll.some(selector => element.matches(selector)))
        .map(element => ({
          className: element.className,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          tagName: element.tagName
        }))
    };
  }, { selector: VISIBLE_CONTROL, allowedVerticalScroll });

  expect(result.overflowX, `${state} must not need horizontal scrolling`).toBeLessThanOrEqual(1);
  expect(result.overflowY, `${state} must not need vertical scrolling`).toBeLessThanOrEqual(1);
  expect(result.clipped, `${state} must keep every control inside its visible activity`).toEqual([]);
  expect(
    result.unexpectedVerticalScrollers,
    `${state} must scroll only in its declared content region`
  ).toEqual([]);
}

test("every logged-in child destination fits an iPad without hidden controls", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(IPAD_LANDSCAPE);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const route of CHILD_SURFACE_ROUTES.filter(route => route.id !== "student-login")) {
    await page.goto(`/preview/child-surfaces.html?surface=${route.id}`, {
      waitUntil: "domcontentloaded"
    });
    const surface = page.locator(`[data-child-surface="${route.id}"]`);
    await expect(surface).toBeVisible();
    const contentRow = page.locator(".kg-main");
    await boundedGeometry(
      await contentRow.count() ? contentRow.first() : surface,
      `${route.id} destination`,
      { allowedVerticalScroll: [".maths-student-area"] }
    );
  }
});

test("all Adventure Map and Letter station types fit an iPad without scrolling", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(IPAD_LANDSCAPE);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const [cycle, station] of QUEST_STATIONS) {
    await page.goto(
      `/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`,
      { waitUntil: "domcontentloaded" }
    );
    const activity = page.locator(`[data-quest-view="round"][data-station-id="${station}"]`);
    await expect(activity).toBeVisible();
    await boundedGeometry(page.locator(".kg-main"), `${cycle} ${station} content row`);
    await boundedGeometry(activity.locator(".sbq-round-card"), `${cycle} ${station} activity card`);
  }
});

test("all 21 standalone games fit an iPad without hidden controls", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize(IPAD_LANDSCAPE);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const game of GAME_LIST) {
    await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}`, {
      waitUntil: "domcontentloaded"
    });
    const player = page.locator(".lg-game-player");
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute("data-surface-name", game.title);
    await boundedGeometry(player.locator(".lg-game-player-main"), `${game.id} game area`);
  }
});
