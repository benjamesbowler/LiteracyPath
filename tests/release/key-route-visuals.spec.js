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

test("A3.2 Reading Library exposes the next collection at the initial phone position", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await page.addStyleTag({
    content: `
      [data-child-surface="reading-library"] .kg-collection-chip {
        font-family: ui-monospace, monospace !important;
        letter-spacing: 0.08em !important;
      }
    `
  });

  const tray = page.locator('[data-child-surface="reading-library"] .kg-collection-tray');
  await expect(tray).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);

  expect(await tray.evaluate(element => element.scrollLeft)).toBe(0);
  const choices = tray.getByRole("button");
  const choiceGeometry = [];
  for (let index = 0; index < await choices.count(); index += 1) {
    choiceGeometry.push({ index, ...await measureVisibleChoice(choices.nth(index)) });
  }
  const geometry = choiceGeometry.find(choice => (
    choice.index > 0
    && choice.visibleWidth > 0
    && choice.visibleWidth < choice.target.width - 1
    && choice.visible.left <= choice.target.left + 1
    && choice.visible.right < choice.target.right - 1
  ));
  expect(
    geometry,
    `Reading Library exposes a partially visible next collection without naming a fixed catalogue entry: ${JSON.stringify(choiceGeometry)}`
  ).toBeTruthy();
  const previousChoice = choiceGeometry[geometry.index - 1];
  expect(
    previousChoice.visibleWidth,
    `the collection before the cue remains fully visible: ${JSON.stringify(previousChoice)}`
  ).toBeGreaterThanOrEqual(previousChoice.target.width - 1);
  expect(
    previousChoice.paintedTextVisibleWidth,
    `the collection before the cue keeps its full painted name: ${JSON.stringify(previousChoice)}`
  ).toBeGreaterThanOrEqual(previousChoice.textWidth - 1);
  expect(
    geometry.textFullyVerticallyVisible,
    `Reading Library exposes a complete-height text cue: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.paintedTextVisibleWidth,
    `Reading Library shows painted text—not only chip padding—for the next collection: ${JSON.stringify(geometry)}`
  ).toBeGreaterThanOrEqual(8);

  const nextCollection = choices.nth(geometry.index);

  // Negative control: measuring only chip-versus-tray overlap used to pass
  // even when the entire tray had moved beyond the viewport.
  await tray.evaluate(element => {
    element.style.transform = "translateX(-500px)";
  });
  const translatedGeometry = await measureVisibleChoice(nextCollection);
  expect(
    translatedGeometry.visibleWidth,
    `visibility includes the viewport and every clipping ancestor: ${JSON.stringify(translatedGeometry)}`
  ).toBe(0);

  // Negative control: a visible chip background is not a discovery cue when
  // the collection name itself is transparent.
  await tray.evaluate(element => {
    element.style.transform = "none";
  });
  await nextCollection.evaluate(element => {
    element.style.color = "transparent";
    element.style.webkitTextFillColor = "transparent";
  });
  const transparentTextGeometry = await measureVisibleChoice(nextCollection);
  expect(transparentTextGeometry.visibleWidth).toBeGreaterThan(0);
  expect(
    transparentTextGeometry.paintedTextVisibleWidth,
    `transparent collection text does not count as a visible cue: ${JSON.stringify(transparentTextGeometry)}`
  ).toBe(0);
});

for (const viewport of [
  { id: "tablet landscape", width: 1024, height: 768, finalTextMinimum: 8 },
  { id: "desktop", width: 1280, height: 900, finalTextMinimum: "full" }
]) {
  test(`A3.2 Reading Library keeps its final collection discoverable at ${viewport.id}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/preview/child-surfaces.html?surface=reading-library");
    const tray = page.locator('[data-child-surface="reading-library"] .kg-collection-tray');
    await expect(tray).toBeVisible();
    await page.evaluate(() => document.fonts?.ready);

    const choices = tray.getByRole("button");
    await expect(choices, `${viewport.id} keeps all four collection choices`).toHaveCount(4);
    const finalChoiceLocator = choices.last();
    await expect(finalChoiceLocator, `${viewport.id} shows its final collection choice`).toBeVisible();
    const finalChoice = await measureVisibleChoice(finalChoiceLocator);
    expect(finalChoice.name, `${viewport.id} names its final collection choice`).not.toBe("");
    expect(finalChoice.textBoxes, `${viewport.id} lays out final-collection text`).not.toHaveLength(0);
    expect(finalChoice.textPainted, `${viewport.id} paints final-collection text`).toBe(true);
    expect(
      finalChoice.textFullyVerticallyVisible,
      `${viewport.id} keeps the full height of final-collection text visible`
    ).toBe(true);
    expect(finalChoice.textWidth, `${viewport.id} gives final-collection text positive width`).toBeGreaterThan(0);
    const minimum = viewport.finalTextMinimum === "full"
      ? Math.max(1, finalChoice.textWidth - 1)
      : viewport.finalTextMinimum;
    expect(
      finalChoice.paintedTextVisibleWidth,
      `${viewport.id} exposes ${viewport.finalTextMinimum === "full" ? "the full" : "a painted-text cue for the"} final collection: ${JSON.stringify(finalChoice)}`
    ).toBeGreaterThanOrEqual(minimum);
  });
}

test("A3.2 Student Home keeps its complete hierarchy while card art is delayed", async ({ page }) => {
  let releaseImages;
  const imagesReleased = new Promise(resolve => {
    releaseImages = resolve;
  });
  const holdImage = async route => {
    await imagesReleased;
    await route.continue();
  };
  await page.route("**/images/home-sage/**", holdImage);
  await page.route("**/images/backdrops/**", holdImage);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html", { waitUntil: "domcontentloaded" });

  const home = page.locator('[data-child-surface="student-home"]');
  const primary = home.locator("[data-child-primary]");
  const firstPlaceholder = home.locator('[data-media-state="loading"]').first();
  await expect(firstPlaceholder).toBeVisible();
  await expect(primary).toBeVisible();
  await expect(primary).toHaveAccessibleName(/Continue Adventure Map/);
  const placeholderBox = await firstPlaceholder.boundingBox();
  expect(placeholderBox?.width).toBeGreaterThan(300);
  expect(placeholderBox?.height).toBeGreaterThan(150);
  releaseImages();
  await expect(home.locator('[data-media-state="ready"]').first()).toBeVisible({ timeout: 10_000 });
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
