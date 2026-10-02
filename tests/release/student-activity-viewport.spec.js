import { expect, test } from "@playwright/test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { CHILD_SURFACE_ROUTES } from "../../src/policy/childSurfaceRules.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { stationsForCycle } from "../../src/components/elQuest/elQuestEngine.js";
import { adventureStationContinuation } from "../../src/policy/adventureContinuation.js";
import { emptyElQuestProgress } from "../../src/utils/adventureMapProgress.js";
import { localProgressStorageKey } from "../../src/utils/progressKeys.js";

const IPAD_LANDSCAPE = { width: 1024, height: 768 };

test("narrow game controls keep full labels and separate movement from steering", async ({ page }) => {
  for (const width of [390, 320]) {
    for (const game of ["star-gallery", "grammar-grind"]) {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/preview/game-overlay.html?game=${game}`);
      const forward = page.getByRole("button", { name: "Move forward", exact: true });
      await expect(forward).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const controls = [...document.querySelectorAll(
          '.sg-game-hud [data-role="move-controls"] button, .sg-game-hud [data-role="steer-controls"] button, .gg-game-hud [data-gg-controls] button'
        )].filter(button => button.getClientRects().length > 0);
        const bounds = controls.map(button => button.getBoundingClientRect());
        const overlap = (a, b) => Math.min(a.right, b.right) > Math.max(a.left, b.left)
          && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
        const collisions = bounds.flatMap((a, index) => bounds.slice(index + 1).filter(b => overlap(a, b)));
        const button = controls.find(control => control.getAttribute("aria-label") === "Move forward");
        const frame = button.getBoundingClientRect();
        const label = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes("FORWARD"));
        const range = document.createRange();
        range.selectNodeContents(label);
        const text = range.getBoundingClientRect();
        const status = document.querySelector('.sg-game-hud [data-role="status"]');
        return {
          geometry: { frame: frame.toJSON(), text: text.toJSON(), font: getComputedStyle(button).font },
          result: {
            labelFits: text.left >= frame.left + 3 && text.right <= frame.right - 3,
            collisions: collisions.length,
            statusOverlaps: status ? bounds.some(rect => overlap(rect, status.getBoundingClientRect())) : false
          }
        };
      });
      expect(layout.result, `${game} at ${width}px: ${JSON.stringify(layout.geometry)}`).toEqual({ labelFits: true, collisions: 0, statusOverlaps: false });
    }
  }
});

const QUEST_STATIONS = [
  ["cycle-1", "letters"],
  ["cycle-1", "sounds"],
  ["cycle-1", "hunt"],
  ["cycle-1", "quick"],
  ["cycle-4", "build"],
  ["cycle-8", "play"],
  ["cycle-1", "compound"],
  ["cycle-1", "trace"],
  ["cycle-1", "check"],
  ["cycle-25", "pattern"],
  ["cycle-25", "chain"],
  ["cycle-25", "speed"],
  ["cycle-25", "compound"],
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

// These are the current production catalogue owners, not a general clipping
// exemption. Every enabled control is then actually scrolled into view below.
const NATIVE_CATALOGUE_SCROLLERS = {
  "student-home": [".kg-home"],
  "arcade": [".lg-game-choice-area"],
  "reading-library": [".kg-books"],
  "skills-practice": [".skills-practice-map"],
  "my-hollow": [".hollow-simple", ".hollow-panel"]
};

async function expectNativeControlsReachable(locator, state, allowedScrollers) {
  const evidence = await locator.evaluate(async (root, { selector, allowedScrollers }) => {
    const shown = element => {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden"
        && Number(style.opacity) !== 0 && element.getClientRects().length > 0
        && !element.closest("details:not([open])");
    };
    const controls = [...root.querySelectorAll(selector)].filter(shown);
    const failures = [];
    let changedScrollPosition = false;
    for (const control of controls) {
      const ancestors = [];
      for (let parent = control.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (allowedScrollers.some(selector => parent.matches(selector))
          && ["auto", "scroll"].includes(style.overflowY)) {
          ancestors.push({ parent, before: parent.scrollTop });
        }
        if (parent === root) break;
      }
      // Scroll only the declared native owners. scrollIntoView can also move an
      // overflow:hidden ancestor, which a child cannot scroll to reveal a choice.
      for (const { parent } of ancestors) {
        const rect = control.getBoundingClientRect();
        const frame = parent.getBoundingClientRect();
        parent.scrollTop += rect.top + rect.height / 2 - frame.top - parent.clientHeight / 2;
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
      changedScrollPosition ||= ancestors.some(({ parent, before }) => parent.scrollTop !== before);
      const rect = control.getBoundingClientRect();
      const bounds = root.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1
        || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1
        || !hit || !(hit === control || control.contains(hit))) {
        failures.push({ label: control.getAttribute("aria-label") || control.textContent?.trim(), rect: rect.toJSON(), hit: hit?.className });
      }
    }
    return { inspected: controls.length, changedScrollPosition, failures };
  }, { selector: VISIBLE_CONTROL, allowedScrollers });
  expect(evidence.inspected, `${state} must inspect real controls`).toBeGreaterThan(0);
  expect(evidence.failures, `${state} must reveal and expose every control after actual scrolling`).toEqual([]);
  return evidence;
}

test("native catalogue reachability rejects controls hidden by a nested clip", async ({ page }) => {
  await page.setContent('<main class="kg-main" style="width:240px;height:120px;overflow:hidden"><div class="kg-home" style="height:100%;overflow:auto"><div style="height:200px;overflow:hidden"><div style="height:70px;overflow:hidden;position:relative"><button style="position:absolute;top:90px;width:56px;height:56px">Unreachable</button></div></div></div></main>');
  let failure;
  try {
    await expectNativeControlsReachable(page.locator(".kg-main"), "nested clip", [".kg-home"]);
  } catch (error) {
    failure = error;
  }
  expect(failure?.message).toContain("must reveal and expose every control after actual scrolling");
});

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
    const surface = page.locator(route.id === "sound-seekers"
      ? "[data-sound-seekers-route-portal]"
      : `[data-child-surface="${route.id}"]`);
    await expect(surface).toBeVisible();
    const contentRow = page.locator(".kg-main");
    const bounded = route.id !== "sound-seekers" && await contentRow.count() ? contentRow.first() : surface;
    const nativeScrollers = NATIVE_CATALOGUE_SCROLLERS[route.id] || [];
    if (nativeScrollers.length) {
      await expect(bounded.locator(nativeScrollers.join(",")).first()).toBeVisible();
    }
    await expect(bounded.locator(VISIBLE_CONTROL).first()).toBeVisible();
    await boundedGeometry(
      bounded,
      `${route.id} destination`,
      { allowedVerticalScroll: nativeScrollers }
    );
    if (nativeScrollers.length) {
      const evidence = await expectNativeControlsReachable(bounded, `${route.id} catalogue`, nativeScrollers);
      if (route.id === "student-home") {
        expect(evidence.changedScrollPosition, "Home must actually scroll to its lower destinations").toBe(true);
      }
    }
  }
});

test("all Adventure Map and Letter station types fit an iPad without scrolling", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(IPAD_LANDSCAPE);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const unlocked = emptyElQuestProgress();
  for (const cycleId of [...new Set(QUEST_STATIONS.filter(([, station]) => station === "check").map(([cycle]) => cycle))]) {
    const cycle = elSkillsBlockCycles.find(item => item.id === cycleId);
    const stations = stationsForCycle(cycle);
    unlocked.cycles[cycleId] = { stations: Object.fromEntries(stations.filter(station => station.id !== "check").slice(0, 4).map(station => [station.id, true])) };
    expect(adventureStationContinuation(stations, unlocked.cycles[cycleId]).checkLocked).toBe(false);
  }
  await page.addInitScript(({ key, progress }) => localStorage.setItem(key, JSON.stringify(progress)), {
    key: localProgressStorageKey("el_quest", "child-surface-preview"), progress: unlocked
  });

  for (const [cycle, station] of QUEST_STATIONS) {
    if (station === "check") {
      await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=check`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".sbq-station.check")).toBeDisabled();
      await expect(page.locator('[data-quest-view="round"][data-station-id="check"]')).toHaveCount(0);
    }
    await page.goto(
      `/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}${station === "check" ? "&preserveAdventure=1" : ""}`,
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

test("legacy poem links open playable Picture Words without verse or poem media", async ({ page }) => {
  await page.setViewportSize(IPAD_LANDSCAPE);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const retiredRequests = [];
  page.on("request", request => {
    if (/\/(?:poem|poems)\//i.test(request.url())) retiredRequests.push(request.url());
  });
  for (const cycle of [1, 4, 27]) {
    await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=cycle-${cycle}&station=poem`,
      { waitUntil: "domcontentloaded" });
    const activity = page.locator('[data-quest-view="round"][data-station-id="compound"]');
    await expect(activity.locator('[data-mechanic-stage="compound-picture"]')).toBeVisible();
    await expect(activity).not.toContainText(/poem|poetry/i);
    await expect(activity.locator('[data-poem-token], .sbq-poem')).toHaveCount(0);
    await waitForChildStageSizing(page);
    await expectFullSizeChildControls(activity, `cycle-${cycle} Picture Words`);
    await activity.getByRole("button", { name: /^Choose / }).first().click();
    await expect(activity.locator('.adventure-round-frame')).toHaveAttribute('data-feedback-tone', /correct|retry/);
  }
  expect(retiredRequests).toEqual([]);
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

test("all 24 standalone games fit an iPad without hidden controls", async ({ page }) => {
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
