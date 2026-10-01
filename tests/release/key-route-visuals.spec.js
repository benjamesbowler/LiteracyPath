import { expect, test } from "@playwright/test";

import { expectVisibleImagesReady } from "./support/visualReadiness.js";

const KEY_ROUTES = Object.freeze([
  { id: "student-home", label: "Student Home" },
  { id: "sound-seekers", label: "Sound Seekers" },
  { id: "story-quests", label: "Learn" },
  { id: "reading-library", label: "Guided Reading" },
  { id: "my-hollow", label: "My Hollow" }
]);

const TARGET_VIEWPORTS = Object.freeze([
  { id: "desktop", width: 1280, height: 900 },
  { id: "phone", width: 390, height: 844 }
]);

const DELAYED_ROUTES = Object.freeze([
  { id: "sound-seekers", label: "Loading Sound Seekers..." },
  { id: "story-quests", label: "Loading Story Quest..." },
  { id: "reading-library", label: "Loading Reading Library..." },
  { id: "my-hollow", label: "Loading your Hollow..." }
]);

async function measureVisibleChoice(choice) {
  return choice.evaluate(element => {
    const target = element.getBoundingClientRect();
    let visibleLeft = Math.max(0, target.left);
    let visibleRight = Math.min(window.innerWidth, target.right);
    let visibleTop = Math.max(0, target.top);
    let visibleBottom = Math.min(window.innerHeight, target.bottom);
    const clips = [];
    let ancestor = element.parentElement;
    while (ancestor && visibleRight > visibleLeft && visibleBottom > visibleTop) {
      const style = getComputedStyle(ancestor);
      const clipsX = /(auto|hidden|scroll|clip)/.test(style.overflowX);
      const clipsY = /(auto|hidden|scroll|clip)/.test(style.overflowY);
      if (clipsX || clipsY) {
        const box = ancestor.getBoundingClientRect();
        if (clipsX) {
          visibleLeft = Math.max(visibleLeft, box.left);
          visibleRight = Math.min(visibleRight, box.right);
        }
        if (clipsY) {
          visibleTop = Math.max(visibleTop, box.top);
          visibleBottom = Math.min(visibleBottom, box.bottom);
        }
        clips.push({
          name: ancestor.className || ancestor.tagName,
          clipsX,
          clipsY,
          box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom }
        });
      }
      ancestor = ancestor.parentElement;
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    const textBoxes = [...range.getClientRects()]
      .filter(box => box.width >= 1 && box.height >= 1)
      .map(box => ({
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom
      }));
    const textVisibleWidth = textBoxes.reduce((total, box) => {
      const visibleTextHeight = Math.max(
        0,
        Math.min(visibleBottom, box.bottom) - Math.max(visibleTop, box.top)
      );
      if (visibleTextHeight < box.bottom - box.top - 1) return total;
      return total + Math.max(
        0,
        Math.min(visibleRight, box.right) - Math.max(visibleLeft, box.left)
      );
    }, 0);
    const textFullyVerticallyVisible = textBoxes.length > 0 && textBoxes.every(box => (
      Math.max(0, Math.min(visibleBottom, box.bottom) - Math.max(visibleTop, box.top))
        >= box.bottom - box.top - 1
    ));
    let effectiveOpacity = 1;
    let visibility = "visible";
    let paintedAncestor = element;
    while (paintedAncestor) {
      const style = getComputedStyle(paintedAncestor);
      effectiveOpacity *= Number.parseFloat(style.opacity || "1");
      if (style.visibility !== "visible") visibility = style.visibility;
      paintedAncestor = paintedAncestor.parentElement;
    }
    const style = getComputedStyle(element);
    const hasZeroAlpha = color => color === "transparent"
      || /rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(color)
      || /rgba\([^)]*\/\s*0(?:\.0+)?%?\s*\)$/.test(color);
    const textPainted = Boolean(element.textContent.trim())
      && visibility === "visible"
      && effectiveOpacity > 0.01
      && !hasZeroAlpha(style.color)
      && !hasZeroAlpha(style.webkitTextFillColor || style.color);
    return {
      name: element.textContent.trim().replace(/\s+/g, " "),
      target: {
        left: target.left,
        top: target.top,
        right: target.right,
        bottom: target.bottom,
        width: target.width
      },
      clips,
      visible: {
        left: visibleLeft,
        top: visibleTop,
        right: visibleRight,
        bottom: visibleBottom
      },
      visibleWidth: visibleBottom > visibleTop
        ? Math.max(0, visibleRight - visibleLeft)
        : 0,
      textBoxes,
      textWidth: textBoxes.reduce((total, box) => total + (box.right - box.left), 0),
      textVisibleWidth,
      textFullyVerticallyVisible,
      textPainted,
      paintedTextVisibleWidth: textPainted ? textVisibleWidth : 0,
      effectiveOpacity,
      visibility,
      color: style.color,
      textFillColor: style.webkitTextFillColor
    };
  });
}

for (const viewport of TARGET_VIEWPORTS) {
  for (const route of KEY_ROUTES) {
    test(`A3.2 ${route.label} matches the ${viewport.id} visual baseline`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(viewport);
      await page.goto(`/preview/child-surfaces.html?surface=${route.id}`);

      const surface = page.locator(`[data-child-surface="${route.id}"]`);
      await expect(surface).toBeVisible();
      await expect(surface.locator("[data-child-title]")).toBeVisible();
      await expect(surface.locator("[data-child-primary]")).toHaveCount(1);
      await expectVisibleImagesReady(page, `${route.label} ${viewport.id} screenshot`);
      await expect.poll(async () => page.evaluate(() => (
        document.documentElement.scrollWidth <= window.innerWidth
      ))).toBe(true);
      await expect(page).toHaveScreenshot(`key-route-${route.id}-${viewport.id}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixelRatio: 0.01
      });
      expect(pageErrors).toEqual([]);
    });
  }
}

test("A3.2 Reading Library paints its discovery control at the initial phone position", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const discovery = page.getByRole("button", { name: "Find a book", exact: true });
  await expect(discovery).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);
  const geometry = await measureVisibleChoice(discovery);
  expect(geometry.textFullyVerticallyVisible).toBe(true);
  expect(geometry.textPainted).toBe(true);
  expect(geometry.paintedTextVisibleWidth).toBeGreaterThanOrEqual(geometry.textWidth - 1);
  expect(geometry.visibleWidth).toBeGreaterThanOrEqual(geometry.target.width - 1);
  // Keep the negative controls: empty padding and transparent words never count
  // as a discoverable action, and viewport clipping remains part of the proof.
  await discovery.evaluate(element => { element.style.transform = "translateX(-500px)"; });
  expect((await measureVisibleChoice(discovery)).visibleWidth).toBe(0);
  await discovery.evaluate(element => {
    element.style.transform = "none"; element.style.color = "transparent";
    element.style.webkitTextFillColor = "transparent";
  });
  expect((await measureVisibleChoice(discovery)).paintedTextVisibleWidth).toBe(0);
});

for (const viewport of [
  { id: "tablet landscape", width: 1024, height: 768 },
  { id: "1199px desktop boundary", width: 1199, height: 900 },
  { id: "1200px desktop boundary", width: 1200, height: 900 },
  { id: "1300px desktop boundary", width: 1300, height: 900 },
  { id: "1301px desktop boundary", width: 1301, height: 900 },
  { id: "1301px tall-landscape boundary", width: 1301, height: 1024 },
  { id: "Chromebook landscape", width: 1366, height: 768 },
  { id: "wider laptop", width: 1440, height: 900 },
  { id: "full HD desktop", width: 1920, height: 1080 }
]) {
  test(`A3.2 Reading Library keeps every collection deliberately discoverable at ${viewport.id}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/preview/child-surfaces.html?surface=reading-library");
    const discovery = page.getByRole("button", { name: "Find a book", exact: true });
    const geometry = await measureVisibleChoice(discovery);
    expect(geometry.textPainted).toBe(true);
    expect(geometry.paintedTextVisibleWidth).toBeGreaterThanOrEqual(geometry.textWidth - 1);
    await discovery.focus(); await discovery.press("Enter");
    const collections = page.getByLabel("Friends or topic", { exact: true });
    await expect(collections).toBeVisible();
    const options = await collections.locator("option").evaluateAll(nodes => nodes.map(node => ({ value: node.value, label: node.textContent.trim() })));
    expect(options.length).toBeGreaterThan(4);
    expect(options.every(option => option.label)).toBe(true);
    expect(options.map(option => option.value)).toEqual(expect.arrayContaining(["dino-pals", "science-and-facts", "willow-street-readers"]));
    await collections.focus(); await expect(collections).toBeFocused();
    const box = await collections.boundingBox();
    // The fitted stage can represent a 56px target as 55.997px at boundaries.
    expect(box.width).toBeGreaterThanOrEqual(55.9); expect(box.height).toBeGreaterThanOrEqual(55.9);
    await collections.selectOption("dino-pals");
    await expect(collections).toHaveValue("dino-pals");
    await page.getByRole("button", { name: "Back to shelf", exact: true }).click();
    await expect(page.locator(".kg-book-card").first()).toBeVisible();
    expect(await page.locator(".kg-book-card").evaluateAll(nodes => nodes.every(node => node.dataset.bookId.startsWith("dino-pals-")))).toBe(true);
  });
}

test("A3.2 Student Home keeps all eight destinations stable while menu art is delayed", async ({ page }) => {
  let releaseImages;
  const imagesReleased = new Promise(resolve => { releaseImages = resolve; });
  await page.route("**/images/navigation/**", async route => {
    await imagesReleased;
    await route.continue();
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  try {
    await page.goto("/preview/student-home-preview.html", { waitUntil: "domcontentloaded" });
    const home = page.locator('[data-child-surface="student-home"]');
    const primary = home.locator("[data-child-primary]");
    const cards = home.locator(".kg-home-door"), art = cards.locator(".kg-home-menu-object");
    const images = art.locator("img");
    await expect(cards).toHaveCount(8);
    await expect(images).toHaveCount(8);
    await expect.poll(() => images.evaluateAll(nodes => nodes.every(image => !image.complete))).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await expect(primary).toBeVisible();
    await expect(primary).toHaveAccessibleName(/Adventure Map/);
    for (const card of await cards.all()) {
      await expect(card).toBeInViewport({ ratio: .99 });
      await expect(card).toHaveAccessibleName(/\S/);
    }
    const boxes = await art.evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
    }));
    for (const box of boxes) { expect(box.width).toBeGreaterThanOrEqual(80); expect(box.height).toBeGreaterThanOrEqual(80); }
    releaseImages();
    await expectVisibleImagesReady(page, "Home menu after delayed art");
    const loadedBoxes = await art.evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
    }));
    expect(loadedBoxes).toEqual(boxes);
    await primary.click();
    await expect(page.locator("html")).toHaveAttribute("data-student-destination", "adventure-map");
  } finally { releaseImages(); }
});

for (const route of DELAYED_ROUTES) {
  test(`A3.2 ${route.id} exposes a named, stable placeholder during a delayed route load`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(
      `/preview/child-route-loading.html?surface=${route.id}&delay=1200`,
      { waitUntil: "domcontentloaded" }
    );

    const fallback = page.locator("[data-route-loading]");
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveAttribute("data-loading-label", route.label);
    await expect(fallback).toContainText(route.label);
    await expect(fallback.locator(".lazy-letter")).toHaveCount(3);
    const fallbackBox = await fallback.boundingBox();
    expect(fallbackBox?.height).toBeGreaterThanOrEqual(500);

    await expect(page.locator(`[data-child-surface="${route.id}"]`)).toBeVisible({
      timeout: 15_000
    });
    await expect(fallback).toHaveCount(0);
  });
}
