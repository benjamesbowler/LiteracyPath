import { expect, test } from "@playwright/test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { QUEST_STORY_QUESTIONS } from "../../src/data/generated/questStoryQuestions.generated.js";
import { CHILD_SURFACE_ROUTES } from "../../src/policy/childSurfaceRules.js";

const IPAD_LANDSCAPE = { width: 1024, height: 768 };

const QUEST_STATIONS = [
  ["cycle-1", "letters"],
  ["cycle-1", "sounds"],
  ["cycle-1", "hunt"],
  ["cycle-1", "quick"],
  ["cycle-1", "build"],
  ["cycle-4", "play"],
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

function coverByTitle() {
  return new Map(
    Object.values(QUEST_STORY_QUESTIONS).flatMap(bank => (
      bank.questions.map(question => [question.title, question.cover])
    ))
  );
}

async function completeCurrentCoverClue(page) {
  const stage = page.locator('[data-mechanic-stage="cover-clue"]');
  const strip = stage.locator('[data-cover-strip="title"]');
  const title = (await strip.textContent())?.trim();
  const expectedCover = coverByTitle().get(title);
  expect(expectedCover, `title strip ${title} needs a known cover`).toBeTruthy();
  await strip.click();
  const covers = stage.locator("[data-cover-piece]");
  const coverPaths = await covers.locator("img").evaluateAll(images => (
    images.map(image => image.getAttribute("src"))
  ));
  const answerIndex = coverPaths.findIndex(path => path === expectedCover);
  expect(answerIndex, `title strip ${title} must have its matching cover`).toBeGreaterThanOrEqual(0);
  await covers.nth(answerIndex).click();
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

test("Adventure Map answers stay readable when iPad browser chrome shortens the view", async ({ page }) => {
  for (const height of [694, 650]) {
    await page.setViewportSize({ width: 1024, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const station of ["letters", "story", "pattern"]) {
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

test("Cover Clue reflows without clipped cover cards on phones", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844, label: "phone portrait" },
    { width: 667, height: 375, label: "short phone landscape" }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      "/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=story",
      { waitUntil: "domcontentloaded" }
    );
    const activity = page.locator('[data-quest-view="round"][data-station-id="story"]');
    await expect(activity).toBeVisible();
    await waitForChildStageSizing(page);
    await expectReadableMechanicControls(activity, viewport.label);
    const geometry = await activity.evaluate(root => {
      const rootRect = root.getBoundingClientRect();
      const frame = root.querySelector(".adventure-round-frame");
      const frameRect = frame.getBoundingClientRect();
      const covers = [...root.querySelectorAll('[data-mechanic-stage="cover-clue"] [data-cover-piece]')]
        .map(button => button.getBoundingClientRect());
      return {
        rootOverflowX: root.scrollWidth - root.clientWidth,
        frameOverflowX: frame.scrollWidth - frame.clientWidth,
        frameInsideHorizontally: frameRect.left >= rootRect.left - 1
          && frameRect.right <= rootRect.right + 1,
        clippedCovers: covers.filter(rect => (
          rect.left < rootRect.left - 1 || rect.right > rootRect.right + 1
        )).length
      };
    });
    expect(geometry.rootOverflowX, `${viewport.label} activity must not scroll sideways`).toBeLessThanOrEqual(1);
    expect(geometry.frameOverflowX, `${viewport.label} frame must not overflow sideways`).toBeLessThanOrEqual(1);
    expect(geometry.frameInsideHorizontally, `${viewport.label} frame must stay inside the activity`).toBe(true);
    expect(geometry.clippedCovers, `${viewport.label} covers must stay inside the activity`).toBe(0);
    const lastCover = activity.locator('[data-mechanic-stage="cover-clue"] [data-cover-piece]').last();
    await lastCover.scrollIntoViewIfNeeded();
    await expect(lastCover).toBeVisible();
  }
});

test("Adventure Map completion actions stay full-size and inside the iPad activity panel", async ({ page }) => {
  await page.setViewportSize(IPAD_LANDSCAPE);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=story");
  await waitForChildStageSizing(page);

  for (let round = 1; round <= 4; round += 1) {
    await expect(page.getByRole("heading", { name: `${round} of 4` })).toBeVisible();
    await completeCurrentCoverClue(page);
    if (round < 4) {
      await expect(page.getByRole("heading", { name: `${round + 1} of 4` })).toBeVisible();
    }
  }

  const completion = page.locator(".sbq-celebrate");
  await expect(completion).toBeVisible();
  await expectFullSizeChildControls(completion, "station completion");
  const geometry = await completion.evaluate(card => {
    const root = card.closest(".kg-main");
    const rootRect = root.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const buttons = [...card.querySelectorAll("button")].map(button => button.getBoundingClientRect());
    const overlaps = buttons.flatMap((left, leftIndex) => buttons.slice(leftIndex + 1).map(right => (
      Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
      * Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top))
    ))).filter(area => area > 1);
    return {
      inside: cardRect.left >= rootRect.left + 8
        && cardRect.right <= rootRect.right - 8
        && cardRect.top >= rootRect.top + 8
        && cardRect.bottom <= rootRect.bottom - 8,
      overlaps
    };
  });
  expect(geometry.inside, "completion card needs an iPad-safe inset").toBe(true);
  expect(geometry.overlaps, "completion actions must not overlap").toEqual([]);
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
