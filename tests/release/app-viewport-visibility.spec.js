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
    await expect(page.locator(`[data-child-surface="${route.id}"]`)).toBeVisible();
    await auditRenderedViewport(page, {
      allowDocumentScroll: route.id === "student-login",
      allowedVerticalScroll: [".maths-student-area"],
      state: `child ${route.id}`
    });
  }
});
