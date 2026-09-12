import { expect, test } from "@playwright/test";

import { CHILD_SURFACE_ROUTES } from "../../src/policy/childSurfaceRules.js";

const COMPACT_MACBOOK = { width: 1440, height: 720 };
const TEACHER_SURFACES = [
  "today",
  "classes",
  "assess",
  "progress",
  "resources",
  "worksheets",
  "settings",
  "report",
  "assessment",
  "guided-reading",
  "accessibility"
];
const INTERACTIVE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[role="button"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"])'
].join(",");

test("Home keeps a balanced inset around its banner actions at every layout size", async ({ page }) => {
  for (const [width, height] of [[1366, 768], [1024, 768], [834, 1194], [390, 844], [320, 568], [568, 320]]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/preview/child-surfaces.html?surface=student-home");
    await page.evaluate(() => document.fonts.ready);
    const inset = await page.locator(".kg-home-hero").evaluate(hero => {
      const frame = hero.getBoundingClientRect();
      const copy = hero.querySelector(".kg-home-hero-copy").getBoundingClientRect();
      const actions = hero.querySelector(".kg-home-hero-actions").getBoundingClientRect();
      return { top: copy.top - frame.top, bottom: frame.bottom - actions.bottom };
    });
    expect(inset.bottom, `${width}x${height}: banner actions have bottom padding`).toBeGreaterThanOrEqual(8);
    expect(Math.abs(inset.top - inset.bottom), `${width}x${height}: balanced banner padding`).toBeLessThan(1);
  }
});

test("the optional Home mission leaves the progress row and doorways separate", async ({ page }) => {
  for (const [width, height] of [[1366, 768], [1024, 768], [834, 1194]]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/preview/student-home-preview.html?scenario=transfer");
    await expect(page.locator(".transfer-card")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const panels = await page.locator(".kg-home").evaluate(home => {
      const bounds = selector => home.querySelector(selector).getBoundingClientRect().toJSON();
      return { hero: bounds(".kg-home-hero"), mission: bounds(".transfer-card"), stops: bounds(".kg-home-stops"), explore: bounds(".kg-home-explore") };
    });
    expect(panels.mission.top - panels.hero.bottom).toBeGreaterThanOrEqual(6);
    expect(panels.explore.top - Math.max(panels.mission.bottom, panels.stops.bottom)).toBeGreaterThanOrEqual(6);
    expect(panels.explore.height).toBeGreaterThan(56);
  }
});

async function auditRenderedViewport(page, {
  allowDocumentScroll = false,
  allowedVerticalScroll = [],
  state
}) {
  const result = await page.evaluate(({ allowDocumentScroll, allowedVerticalScroll, interactiveSelector }) => {
    const isVisible = element => {
      if (element.closest("details:not([open])")) return false;
      if (element.closest("[hidden], [aria-hidden='true']")) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const label = element => (
      element.getAttribute("aria-label")
      || element.textContent?.replace(/\s+/g, " ").trim()
      || element.tagName
    ).slice(0, 120);
    const canScroll = (element, axis) => {
      const style = getComputedStyle(element);
      if (axis === "x") {
        return element.scrollWidth > element.clientWidth + 1
          && ["auto", "scroll"].includes(style.overflowX);
      }
      return element.scrollHeight > element.clientHeight + 1
        && ["auto", "scroll"].includes(style.overflowY);
    };
    const axisReachable = (element, axis) => {
      const rect = element.getBoundingClientRect();
      const viewportStart = 0;
      const viewportEnd = axis === "x" ? innerWidth : innerHeight;
      let start = axis === "x" ? rect.left : rect.top;
      let end = axis === "x" ? rect.right : rect.bottom;
      let ancestor = element.parentElement;

      while (ancestor && ancestor !== document.documentElement) {
        const style = getComputedStyle(ancestor);
        const ancestorRect = ancestor.getBoundingClientRect();
        const ancestorStart = axis === "x" ? ancestorRect.left : ancestorRect.top;
        const ancestorEnd = axis === "x" ? ancestorRect.right : ancestorRect.bottom;
        const outsideAncestor = start < ancestorStart - 1 || end > ancestorEnd + 1;
        const overflow = axis === "x" ? style.overflowX : style.overflowY;

        if (outsideAncestor && canScroll(ancestor, axis)) return true;
        if (outsideAncestor && ["hidden", "clip"].includes(overflow)) return false;
        start = Math.max(start, ancestorStart);
        end = Math.min(end, ancestorEnd);
        ancestor = ancestor.parentElement;
      }

      const outsideViewport = start < viewportStart - 1 || end > viewportEnd + 1;
      if (!outsideViewport) return true;
      if (axis === "y" && allowDocumentScroll) {
        return document.documentElement.scrollHeight > innerHeight + 1;
      }
      return false;
    };

    const controls = [...document.querySelectorAll(interactiveSelector)].filter(isVisible);
    const unreachable = controls.filter(element => (
      !axisReachable(element, "x") || !axisReachable(element, "y")
    )).map(element => ({ label: label(element), rect: element.getBoundingClientRect().toJSON() }));
    const verticalScrollers = [...document.querySelectorAll("*")]
      .filter(element => canScroll(element, "y"))
      .map(element => ({
        allowed: allowedVerticalScroll.some(selector => element.matches(selector))
          || (allowDocumentScroll && [document.documentElement, document.body].includes(element)),
        className: typeof element.className === "string" ? element.className : "",
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        tagName: element.tagName
      }));

    return {
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      documentOverflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      unreachable,
      unexpectedVerticalScrollers: verticalScrollers.filter(scroller => !scroller.allowed)
    };
  }, {
    allowDocumentScroll,
    allowedVerticalScroll,
    interactiveSelector: INTERACTIVE_SELECTOR
  });

  expect(result.documentOverflowX, `${state} has no document-level horizontal overflow`).toBeLessThanOrEqual(1);
  if (!allowDocumentScroll) {
    expect(result.documentOverflowY, `${state} keeps whole-page scrolling disabled`).toBeLessThanOrEqual(1);
  }
  expect(result.unreachable, `${state} has no hard-clipped controls`).toEqual([]);
  expect(
    result.unexpectedVerticalScrollers,
    `${state} scrolls only in declared content regions`
  ).toEqual([]);
}

test("every teacher destination is reachable in a compact MacBook browser window", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(COMPACT_MACBOOK);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const surfaceId of TEACHER_SURFACES) {
    await page.goto(`/preview/teacher-a11y.html?surface=${surfaceId}`, { waitUntil: "networkidle" });
    await expect(page.locator(`[data-preview-surface="${surfaceId}"]`)).toBeVisible();
    await auditRenderedViewport(page, {
      allowedVerticalScroll: [".lg-content-area", ".comprehension-passage-card"],
      state: `teacher ${surfaceId}`
    });
  }
});

test("every child destination is visible or reachable in a compact MacBook browser window", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(COMPACT_MACBOOK);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const route of CHILD_SURFACE_ROUTES) {
    await page.goto(`/preview/child-surfaces.html?surface=${route.id}`, { waitUntil: "networkidle" });
    const surface = page.locator(route.id === "sound-seekers"
      ? "[data-sound-seekers-route-portal]"
      : `[data-child-surface="${route.id}"]`);
    await expect(surface).toBeVisible();
    await auditRenderedViewport(page, {
      allowDocumentScroll: route.id === "student-login",
      state: `child ${route.id}`
    });
  }
});
