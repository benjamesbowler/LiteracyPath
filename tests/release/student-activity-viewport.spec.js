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
  ["cycle-8", "play"],
  ["cycle-1", "poem"],
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

async function waitForChildStageSizing(page) {
  await expect.poll(() => page.locator(".adventure-round-frame button:visible").evaluateAll(buttons => {
    if (buttons.length === 0) return 0;
    return Math.min(...buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return Math.min(rect.width, rect.height);
    }));
  }), {
    message: "child stage must finish calculating its physical target size"
  }).toBeGreaterThanOrEqual(55.9);
}

async function boundedGeometry(locator, state, {
  allowedHorizontalScroll = [],
  allowedVerticalScroll = []
} = {}) {
  const result = await locator.evaluate((root, {
    selector,
    allowedHorizontalScroll,
    allowedVerticalScroll
  }) => {
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
        const scrollsVertically = ancestor.scrollHeight > ancestor.clientHeight + 1
          && ["auto", "scroll"].includes(style.overflowY);
        const scrollsHorizontally = ancestor.scrollWidth > ancestor.clientWidth + 1
          && ["auto", "scroll"].includes(style.overflowX);
        if (scrollsVertically) {
          return allowedVerticalScroll.some(selector => ancestor.matches(selector));
        }
        if (scrollsHorizontally) {
          return allowedHorizontalScroll.some(selector => ancestor.matches(selector));
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
  }, { selector: VISIBLE_CONTROL, allowedHorizontalScroll, allowedVerticalScroll });

  expect(result.overflowX, `${state} must not need horizontal scrolling`).toBeLessThanOrEqual(1);
  expect(result.overflowY, `${state} must not need vertical scrolling`).toBeLessThanOrEqual(1);
  expect(result.clipped, `${state} must keep every control inside its visible activity`).toEqual([]);
  expect(
    result.unexpectedVerticalScrollers,
    `${state} must scroll only in its declared content region`
  ).toEqual([]);
}

async function expectFullSizeChildControls(locator, state) {
  const undersized = await locator.locator("button:visible").evaluateAll(buttons => buttons
    .map(button => {
      const rect = button.getBoundingClientRect();
      return {
        label: button.getAttribute("aria-label") || button.textContent?.trim() || "button",
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2))
      };
    })
    .filter(button => button.width < 55.9 || button.height < 55.9));
  expect(undersized, `${state} needs 56px child controls`).toEqual([]);
}

async function expectReadableMechanicControls(locator, state) {
  const undersized = await locator
    .locator("[data-mechanic-stage] button:visible")
    .evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return {
        label: button.getAttribute("aria-label") || button.textContent?.trim() || "mechanic control",
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2))
      };
    }).filter(button => button.width < 55.9 || button.height < 55.9));
  expect(undersized, `${state} needs readable mechanic controls, not tiny targets`).toEqual([]);
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
      `${route.id} destination`
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
    await waitForChildStageSizing(page);
    await boundedGeometry(page.locator(".kg-main"), `${cycle} ${station} content row`);
    await boundedGeometry(activity.locator(".adventure-round-frame"), `${cycle} ${station} round frame`);
    await expectFullSizeChildControls(activity, `${cycle} ${station}`);
    await expectReadableMechanicControls(activity, `${cycle} ${station}`);
  }
});

test("one-letter poem tokens stay full size while the answer is locked", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 650 });
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=poem",
    { waitUntil: "domcontentloaded" }
  );
  const activity = page.locator('[data-quest-view="round"][data-station-id="poem"]');
  await expect(activity).toBeVisible();
  await waitForChildStageSizing(page);

  const tokens = activity.locator(".sbq-poem-token");
  const shortIndex = await tokens.evaluateAll(buttons => buttons.findIndex(button => (
    String(button.textContent || "").replace(/[^a-z]/gi, "").length === 1
  )));
  expect(shortIndex, "cycle 1 needs an actual one-letter poem token fixture").toBeGreaterThanOrEqual(0);
  const shortToken = tokens.nth(shortIndex);
  await shortToken.click();
  await expect(shortToken).toBeDisabled();

  const size = await shortToken.evaluate(button => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(size.width).toBeGreaterThanOrEqual(55.9);
  expect(size.height).toBeGreaterThanOrEqual(55.9);
  await boundedGeometry(activity.locator(".adventure-round-frame"), "locked one-letter poem token");
});

test("Poem Spotlight keeps optional line support out of the way until a miss", async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&quest=cycle-4&station=poem",
    { waitUntil: "domcontentloaded" }
  );

  const activity = page.locator('[data-quest-view="round"][data-station-id="poem"]');
  const poem = activity.locator('[data-mechanic-stage="poem-spotlight"] .sbq-poem');
  const lines = poem.locator("[data-poem-line]");
  const markers = poem.locator("[data-poem-line-marker]");
  await expect(activity).toBeVisible();
  await waitForChildStageSizing(page);
  await expect(lines).toHaveCount(4);
  await expect(markers).toHaveCount(0);
  await expect(poem.locator(".sbq-poem-word-marker")).toHaveCount(0);

  const prompt = await activity.locator(".adventure-round-frame__instruction").textContent();
  const targetMatch = prompt?.match(/Find the word [“"]([^”"]+)[”"]/i);
  expect(targetMatch, "Poem Spotlight must name the printed target word").toBeTruthy();
  const targetWord = targetMatch[1].trim().toLowerCase();
  const tokenId = await poem.locator("[data-poem-token]").evaluateAll((tokens, expected) => {
    const normalize = value => String(value || "").toLowerCase().replace(/[^a-z']/g, "");
    return tokens.find(token => normalize(token.textContent) === expected)?.dataset.poemToken || "";
  }, targetWord);
  expect(tokenId, `Poem Spotlight must render the target word “${targetWord}”`).toBeTruthy();
  const target = poem.locator(`[data-poem-token="${tokenId}"]`);
  await expect(target).toHaveCount(1);

  const geometry = await poem.evaluate(root => {
    const rootRect = root.getBoundingClientRect();
    const stage = root.closest(".adventure-round-frame__stage");
    const lines = [...root.querySelectorAll("[data-poem-line]")];
    const controls = [...root.querySelectorAll("button")];
    const overlapArea = (left, right) => (
      Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
      * Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top))
    );
    return {
      horizontalOverflow: root.scrollWidth - root.clientWidth,
      poemOverflowY: getComputedStyle(root).overflowY,
      poemHasOwnScroll: root.scrollHeight > root.clientHeight + 1,
      stageOverflowY: stage ? getComputedStyle(stage).overflowY : "missing",
      stageHasScroll: Boolean(stage) && stage.scrollHeight > stage.clientHeight + 1,
      clippedMarkers: lines.filter(line => {
        const marker = line.querySelector("[data-poem-line-marker]");
        if (!marker) return false;
        const rect = marker.getBoundingClientRect();
        return rect.left < rootRect.left - 1 || rect.right > rootRect.right + 1;
      }).length,
      markerTokenOverlaps: lines.flatMap(line => {
        const markerRect = line.querySelector("[data-poem-line-marker]")?.getBoundingClientRect();
        if (!markerRect) return [];
        return [...line.querySelectorAll("button")]
          .map(button => overlapArea(markerRect, button.getBoundingClientRect()))
          .filter(area => area > 1);
      }),
      lineOverlaps: lines.flatMap((line, index) => lines.slice(index + 1)
        .map(other => overlapArea(line.getBoundingClientRect(), other.getBoundingClientRect()))
        .filter(area => area > 1)),
      undersizedControls: controls.map(button => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }).filter(control => control.width < 55.9 || control.height < 55.9)
    };
  });

  expect(geometry.horizontalOverflow, "phone poem must not scroll sideways").toBeLessThanOrEqual(1);
  expect(geometry.poemOverflowY, "phone poem must expand inside the stage scroller").toBe("visible");
  expect(geometry.poemHasOwnScroll, "phone poem must not create a nested scroll route").toBe(false);
  expect(geometry.stageOverflowY, "the stage owns the phone's poem scroll route").toBe("auto");
  expect(geometry.stageHasScroll, "the full wrapped poem must remain reachable through the stage").toBe(true);
  expect(geometry.clippedMarkers, "every line marker must stay in its visible gutter").toBe(0);
  expect(geometry.markerTokenOverlaps, "line markers must not cover poem words").toEqual([]);
  expect(geometry.lineOverlaps, "authored line groups must not overlap").toEqual([]);
  expect(geometry.undersizedControls, "wrapped poem words must keep the 56px target floor").toEqual([]);

  const wrongId = await poem.locator("[data-poem-token]").evaluateAll((tokens, expected) => {
    const normalize = value => String(value || "").toLowerCase().replace(/[^a-z']/g, "");
    return tokens.find(token => normalize(token.textContent) !== expected)?.dataset.poemToken || "";
  }, targetWord);
  expect(wrongId, "Poem Spotlight needs a wrong-word retry fixture").toBeTruthy();
  await poem.locator(`[data-poem-token="${wrongId}"]`).click();
  await expect(markers).toHaveCount(4);
  await expect(poem.locator(".sbq-poem-word-marker")).not.toHaveCount(0);
  await expect(target).toBeEnabled();
  await target.click();
  await expect(page.getByRole("heading", { name: "2 of 3" })).toBeVisible();
});

test("Adventure Map answers stay readable when iPad browser chrome shortens the view", async ({ page }) => {
  for (const height of [694, 650]) {
    await page.setViewportSize({ width: 1024, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const station of ["letters", "pattern"]) {
      const cycle = station === "pattern" ? "cycle-25" : "cycle-1";
      await page.goto(
        `/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`,
        { waitUntil: "domcontentloaded" }
      );
      const activity = page.locator(`[data-quest-view="round"][data-station-id="${station}"]`);
      await expect(activity).toBeVisible();
      await waitForChildStageSizing(page);
      await boundedGeometry(activity.locator(".adventure-round-frame"), `${height}px ${station} round frame`);
      await expectFullSizeChildControls(activity, `${height}px ${station}`);
      await expectReadableMechanicControls(activity, `${height}px ${station}`);
    }
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
