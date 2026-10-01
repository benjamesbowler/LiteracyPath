import { expect, test } from "@playwright/test";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";

const scope = "child-surface-preview";

const CARD_CONTENT = ".hollow-art, strong, em, small, .hollow-price, .hollow-meter, button, [data-child-emphasis-cue], .kg-book-cover, .kg-book-title, .kg-book-purpose, .kg-book-read, .kg-home-door-art, .kg-home-door-foot";

// Use real glyph ink rather than a heading's reserved font ascent or a passing
// card box. The same inspection can include viewport/clipping ancestors after
// each label is scrolled into view, or only the card for offscreen row reflow.
function inspectCatalogueContent(nodes, { selector = null, viewport = false } = {}) {
  const checked = { cards: nodes.length, elements: 0, textNodes: 0, inkBoxes: 0 }, failures = [];
  const context = document.createElement("canvas").getContext("2d");
  const within = (rect, clip) => rect.left >= clip.left - 1 && rect.right <= clip.right + 1 && rect.top >= clip.top - 1 && rect.bottom <= clip.bottom + 1;
  for (const card of nodes) {
    const cardBox = card.getBoundingClientRect();
    const elements = selector ? [...card.querySelectorAll(selector)] : [card];
    if (!elements.length) failures.push({ card: card.className, reason: "no inspected descendants" });
    for (const element of elements) {
      checked.elements++;
      const style = getComputedStyle(element), box = element.getBoundingClientRect();
      if (!element.getClientRects().length || style.display === "none" || style.visibility === "hidden") continue;
      const clips = viewport ? [{ left: 0, right: innerWidth, top: 0, bottom: innerHeight }] : [cardBox];
      for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
        const ancestorStyle = getComputedStyle(ancestor), bounds = ancestor.getBoundingClientRect();
        const x = /^(auto|hidden|scroll|clip)$/.test(ancestorStyle.overflowX);
        const y = /^(auto|hidden|scroll|clip)$/.test(ancestorStyle.overflowY);
        if (x || y) clips.push({
          left: x ? bounds.left + ancestor.clientLeft : -Infinity,
          right: x ? bounds.left + ancestor.clientLeft + ancestor.clientWidth : Infinity,
          top: y ? bounds.top + ancestor.clientTop : -Infinity,
          bottom: y ? bounds.top + ancestor.clientTop + ancestor.clientHeight : Infinity
        });
        if (!viewport && ancestor === card) break;
      }
      if (selector && !within(box, cardBox)) failures.push({ card: card.textContent.trim(), element: element.className, reason: "descendant escapes card" });
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        if (!text.textContent.trim()) continue;
        checked.textNodes++;
        const textStyle = getComputedStyle(text.parentElement);
        context.font = textStyle.font;
        let offset = 0;
        for (const character of text.textContent) {
          const length = character.length;
          if (character.trim()) {
            const range = document.createRange(); range.setStart(text, offset); range.setEnd(text, offset + length);
            const rect = range.getBoundingClientRect(), metrics = context.measureText(character);
            const fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            if (!Number.isFinite(fontHeight) || fontHeight <= 0) failures.push({ element: element.className, reason: "glyph metrics unavailable" });
            else if (rect.width > 0 && rect.height > 0) {
              const scaleY = rect.height / fontHeight, baseline = rect.top + metrics.fontBoundingBoxAscent * scaleY;
              const ink = { left: rect.left - metrics.actualBoundingBoxLeft, right: rect.left + metrics.actualBoundingBoxRight,
                top: baseline - metrics.actualBoundingBoxAscent * scaleY, bottom: baseline + metrics.actualBoundingBoxDescent * scaleY };
              checked.inkBoxes++;
              const clippedBy = clips.find(clip => !within(ink, clip));
              if (clippedBy) failures.push({ element: element.className, character, reason: "glyph ink clipped", ink, clippedBy });
            }
          }
          offset += length;
        }
      }
    }
  }
  return { checked, failedCount: failures.length, failures: failures.slice(0, 12) };
}

async function cardContentFailures(cards) {
  const result = await cards.evaluateAll(inspectCatalogueContent, { selector: CARD_CONTENT });
  expect(result.checked.cards).toBeGreaterThan(0);
  expect(result.checked.elements).toBeGreaterThanOrEqual(result.checked.cards);
  expect(result.checked.textNodes).toBeGreaterThan(0);
  expect(result.checked.inkBoxes).toBeGreaterThan(0);
  return result.failures;
}

async function expectTextInkPainted(labels) {
  expect(await labels.count()).toBeGreaterThan(0);
  for (const label of await labels.all()) {
    await label.scrollIntoViewIfNeeded();
    const result = await label.evaluateAll(inspectCatalogueContent, { viewport: true });
    expect(result.checked.inkBoxes).toBeGreaterThan(0);
    expect(result.failures).toEqual([]);
  }
}

async function enlargeText(page) {
  // All current menu sizes use px. Merely doubling html's font would not change
  // their paint. Snapshot every direct text owner's actual browser style first,
  // then double font and line height once without inherited double-scaling.
  return page.locator(".kg-stage").evaluate(async stage => {
    const elements = [...stage.querySelectorAll("*")].filter(element => [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) && !element.closest("svg, .kg-home-word-glyphs, .kg-home-letter-glyphs"));
    const initial = elements.map(element => ({ element, font: parseFloat(getComputedStyle(element).fontSize), line: parseFloat(getComputedStyle(element).lineHeight) }));
    for (const { element, font, line } of initial) {
      element.style.setProperty("font-size", `${font * 2}px`, "important");
      element.style.setProperty("line-height", Number.isFinite(line) ? `${line * 2}px` : "normal", "important");
    }
    await Promise.all(initial.flatMap(({ element }) => element.getAnimations()).map(animation => animation.finished.catch(() => {})));
    return initial.map(({ element, font }) => ({ element: element.className, text: element.textContent.trim().slice(0, 40), before: font, after: parseFloat(getComputedStyle(element).fontSize) }));
  });
}

async function expectControlPainted(control) {
  await control.scrollIntoViewIfNeeded();
  const result = await control.evaluate(element => {
    const box = element.getBoundingClientRect();
    let left = Math.max(0, box.left), right = Math.min(innerWidth, box.right), top = Math.max(0, box.top), bottom = Math.min(innerHeight, box.bottom);
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor), rect = ancestor.getBoundingClientRect();
      if (/(auto|hidden|scroll|clip)/.test(style.overflowX)) { left = Math.max(left, rect.left + parseFloat(style.borderLeftWidth)); right = Math.min(right, rect.right - parseFloat(style.borderRightWidth)); }
      if (/(auto|hidden|scroll|clip)/.test(style.overflowY)) { top = Math.max(top, rect.top + parseFloat(style.borderTopWidth)); bottom = Math.min(bottom, rect.bottom - parseFloat(style.borderBottomWidth)); }
    }
    const hit = document.elementsFromPoint((left + right) / 2, (top + bottom) / 2)[0];
    return { width: right - left, height: bottom - top, targetWidth: box.width, targetHeight: box.height, hit: element === hit || element.contains(hit) };
  });
  expect(result.width).toBeGreaterThanOrEqual(Math.min(56, result.targetWidth) - 1);
  expect(result.height).toBeGreaterThanOrEqual(Math.min(56, result.targetHeight) - 1);
  expect(result.hit).toBe(true);
}

for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 320, height: 568 }, { width: 568, height: 320 }]) {
  test(`Books shows the complete eligible gallery and protects long titles at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/preview/child-surfaces.html?surface=reading-library");
    const surface = page.locator(".kg-books"), cards = surface.locator(".kg-book-card");
    await expect(cards).toHaveCount(getRuntimeGuidedReadingBooks().length);
    await expect(cards.locator(".kg-book-title")).toHaveCount(getRuntimeGuidedReadingBooks().length);
    await expect(cards.locator(".kg-book-cover")).toHaveCount(getRuntimeGuidedReadingBooks().length);
    await expect(surface.getByRole("button", { name: "More books", exact: true })).toHaveCount(0);
    await expect(surface.getByRole("navigation", { name: "Book pictures" }).getByRole("button", { name: "Facts", exact: true })).toBeVisible();
    await expect(surface.locator('.kg-book-topic-cover[data-book-cover-state="ready"]')).toHaveCount(await surface.locator(".kg-book-topic-cover").count());
    await expect.poll(() => surface.locator(".kg-book-cover img").evaluateAll(images => images.filter(image => {
      const rect = image.getBoundingClientRect(); return rect.bottom > 0 && rect.top < innerHeight;
    }).every(image => image.naturalWidth > 0 && getComputedStyle(image).opacity === "1"))).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: testInfo.outputPath("books-gallery.png") });
    for (const title of ["Emperor Penguins and Their Relatives", "Honeybees and Pollination"]) {
      const card = cards.filter({ has: page.locator(".kg-book-title", { hasText: title }) });
      await expect(card).toHaveCount(1);
      await expect(card.locator(".kg-book-title")).toHaveCount(1);
      await expect(card.locator(".kg-book-cover")).toHaveCount(1);
      expect(await cardContentFailures(card)).toEqual([]);
    }
    const before = await cards.first().boundingBox();
    await surface.getByRole("button", { name: "Find a book", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Find a book" })).toBeVisible();
    const during = await cards.first().boundingBox();
    expect(during.height).toBeCloseTo(before.height, 1);
    expect(during.width).toBeCloseTo(before.width, 1);
    await page.getByRole("dialog", { name: "Find a book" }).getByRole("button", { name: "Back to shelf" }).click();
    await expectControlPainted(cards.last());
    const scroll = await surface.evaluate(element => ({ y: getComputedStyle(element).overflowY, top: element.scrollTop, page: document.documentElement.scrollHeight <= innerHeight + 1 }));
    expect(scroll.y).toBe("auto"); expect(scroll.top).toBeGreaterThan(0); expect(scroll.page).toBe(true);
  });

  test(`Hollow contains the full two-friend and three-egg content at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(scope => localStorage.setItem(`lp-hollow:${scope}`, JSON.stringify({ purchases: [
      { id: "welcome", item: "egg-welcome", cost: 0, at: "2026-09-01T00:00:00Z" },
      { id: "bronze", item: "egg-bronze", cost: 100, at: "2026-09-02T00:00:00Z" }
    ], feeds: [], chests: [], layout: { slots: {}, equipped: {} } })), scope);
    await page.goto("/preview/child-surfaces.html?surface=my-hollow");
    await page.getByRole("button", { name: "Beasties", exact: true }).click();
    const friends = page.locator(".hollow-beastie");
    await expect(friends).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => friends.locator(".hollow-art img").evaluateAll(images => images.every(image => image.naturalWidth > 0 && getComputedStyle(image).objectFit === "contain"))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("hollow-two-friends.png") });
    expect(await cardContentFailures(friends)).toEqual([]);
    for (const feed of await friends.getByRole("button", { name: /^Feed / }).all()) await expect(feed).toBeDisabled();
    await expect(friends.locator(".hollow-feed-help")).toHaveCount(2);
    const books = friends.first().getByRole("button", { name: "Go to Books", exact: true });
    await expect(books).toHaveCSS("background-color", "rgb(52, 84, 200)");
    await expectControlPainted(books);
    await books.click();
    await expect(page.locator("html")).toHaveAttribute("data-student-destination", "reading-library");
    await page.getByRole("button", { name: "Find another friend", exact: true }).click();
    const eggs = page.locator(".hollow-ware");
    await expect(eggs).toHaveCount(3);
    await expect.poll(() => eggs.locator(".hollow-art img").evaluateAll(images => images.every(image => image.naturalWidth > 0 && getComputedStyle(image).objectFit === "contain"))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("hollow-three-eggs.png") });
    expect(await cardContentFailures(eggs)).toEqual([]);
    for (const egg of await eggs.all()) await expect(egg).toBeDisabled();
    await expectControlPainted(page.getByRole("button", { name: "Back to my Hollow", exact: true }));
    await page.getByRole("button", { name: "Decorations", exact: true }).click();
    const decorations = page.locator(".hollow-ware");
    expect(await decorations.count()).toBeGreaterThan(6);
    expect(await cardContentFailures(decorations)).toEqual([]);
    await expect(page.getByRole("navigation", { name: "Shop pages" })).toHaveCount(0);
  });
}

test("content guard rejects a Hollow card shortened below its complete artwork and action", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=my-hollow");
  await page.getByRole("button", { name: "Open your gift", exact: true }).click();
  const card = page.locator(".hollow-beastie").first();
  expect(await cardContentFailures(card)).toEqual([]);
  await card.evaluate(element => { element.style.height = "60px"; element.style.overflow = "hidden"; });
  expect((await cardContentFailures(card)).length).toBeGreaterThan(0);
});

test("content guard inspects actual Books descendants and rejects truncated title ink", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await page.evaluate(() => document.fonts.ready);
  const card = page.locator(".kg-book-card").filter({ has: page.locator(".kg-book-title", { hasText: "Emperor Penguins and Their Relatives" }) });
  await expect(card.locator(".kg-book-title")).toHaveCount(1);
  await expect(card.locator(".kg-book-cover")).toHaveCount(1);
  expect(await cardContentFailures(card)).toEqual([]);
  await card.locator(".kg-book-title").evaluate(title => { title.style.height = "12px"; title.style.overflow = "hidden"; });
  expect((await cardContentFailures(card)).some(failure => failure.reason === "glyph ink clipped")).toBe(true);
});

test("a downloaded cover retains its painted title fallback until its pixels decode", async ({ page }) => {
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    window.releaseBookDecodes = [];
    HTMLImageElement.prototype.decode = function () {
      if (!this.src.includes("/guided-reading/")) return decode.call(this);
      const image = this;
      image.dataset.waitingForDecode = "true";
      return new Promise((resolve, reject) => window.releaseBookDecodes.push(() => decode.call(image).then(resolve, reject)));
    };
  });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const cover = page.locator(".kg-book-card").first().locator(".kg-book-cover");
  await expect(cover.locator("img")).toHaveAttribute("data-waiting-for-decode", "true");
  await expect(cover).toHaveAttribute("data-book-cover-state", "loading");
  await expect(cover.locator(".kg-book-cover-fallback-art svg")).toBeVisible();
  await expect(cover.locator(".kg-book-cover-fallback-art strong")).toHaveText(await page.locator(".kg-book-card").first().locator(".kg-book-title").innerText());
  await page.evaluate(() => window.releaseBookDecodes.splice(0).forEach(release => release()));
  await expect(cover).toHaveAttribute("data-book-cover-state", "ready");
  await expect(cover.locator("img")).toHaveCSS("opacity", "1");
  await expect(cover.locator(".kg-book-cover-fallback-art")).toBeHidden();
});

for (const textScale of [1, 2]) {
test(`keyboard focus keeps the last book fully painted through late cover decoding at ${textScale * 100}% text`, async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 768, height: 901 });
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    window.releaseBookDecodes = [];
    window.holdBookDecodes = true;
    HTMLImageElement.prototype.decode = function () {
      if (!window.holdBookDecodes || !this.src.includes("/guided-reading/")) return decode.call(this);
      const image = this;
      image.dataset.waitingForDecode = "true";
      return new Promise((resolve, reject) => window.releaseBookDecodes.push(() => decode.call(image).then(resolve, reject)));
    };
  });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await page.evaluate(() => document.fonts.ready);
  if (textScale === 2) {
    const enlarged = await enlargeText(page);
    expect(enlarged.length).toBeGreaterThan(20);
    expect(enlarged.filter(value => !Number.isFinite(value.after) || Math.abs(value.after - value.before * 2) >= .1)).toEqual([]);
  }
  const card = page.locator(".kg-book-card").last(), cover = card.locator(".kg-book-cover");
  const focusGeometry = () => card.evaluate(element => {
    const box = element.getBoundingClientRect(), style = getComputedStyle(element);
    const outset = Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
    const target = { left: box.left - outset, right: box.right + outset, top: box.top - outset, bottom: box.bottom + outset };
    const clips = [{ name: "viewport", left: 0, right: innerWidth, top: 0, bottom: innerHeight }];
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const bounds = ancestor.getBoundingClientRect(), ancestorStyle = getComputedStyle(ancestor);
      const x = /^(auto|hidden|scroll|clip)$/.test(ancestorStyle.overflowX), y = /^(auto|hidden|scroll|clip)$/.test(ancestorStyle.overflowY);
      if (x || y) clips.push({ name: ancestor.className, left: x ? bounds.left + ancestor.clientLeft : -Infinity, right: x ? bounds.left + ancestor.clientLeft + ancestor.clientWidth : Infinity,
        top: y ? bounds.top + ancestor.clientTop : -Infinity, bottom: y ? bounds.top + ancestor.clientTop + ancestor.clientHeight : Infinity });
    }
    return { target, clips, failures: clips.filter(clip => target.left < clip.left - 1 || target.right > clip.right + 1 || target.top < clip.top - 1 || target.bottom > clip.bottom + 1) };
  });
  await card.evaluate(element => element.focus({ preventScroll: true }));
  await expect(card).toBeFocused();
  await expect.poll(async () => (await focusGeometry()).failures).toEqual([]);
  await expect(cover.locator("img")).toHaveAttribute("data-waiting-for-decode", "true");
  await expect(cover).toHaveAttribute("data-book-cover-state", "loading");
  const loading = await focusGeometry(), loadingCover = await cover.boundingBox();
  if (textScale === 2) expect(loadingCover.height).toBeGreaterThan(loadingCover.width * 3 / 4 + 1);
  await page.evaluate(() => { window.holdBookDecodes = false; window.releaseBookDecodes.splice(0).forEach(release => release()); });
  await expect(cover).toHaveAttribute("data-book-cover-state", "ready");
  await expect(cover.locator(".kg-book-cover-fallback-art")).toBeHidden();
  const ready = await focusGeometry(), readyCover = await cover.boundingBox();
  await testInfo.attach("late-cover-layout.json", { body: Buffer.from(JSON.stringify({ textScale, loading, ready, loadingCover, readyCover }, null, 2)), contentType: "application/json" });
  expect(readyCover.height).toBeCloseTo(loadingCover.height, 1);
  // Native scroll offsets round to whole pixels; use the same 1px precision
  // as the mandatory clipping guard, while checking full paint separately.
  expect(Math.abs(ready.target.top - loading.target.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(ready.target.bottom - loading.target.bottom)).toBeLessThanOrEqual(1);
  // No test scroll after focus: late pixels must not push the child's focused
  // choice or its painted outline beneath the fixed navigation.
  await expect.poll(async () => (await focusGeometry()).failures).toEqual([]);
  const text = await card.evaluateAll(inspectCatalogueContent, { selector: CARD_CONTENT, viewport: true });
  expect(text.checked.inkBoxes).toBeGreaterThan(0);
  expect(text.failures).toEqual([]);
});
}

for (const viewport of [{ width: 1366, height: 768 }, { width: 320, height: 568 }, { width: 568, height: 320 }]) {
  test(`My Guide keeps every owned gear choice and a usable picker at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(scope => localStorage.setItem(`lp-hollow:${scope}`, JSON.stringify({ purchases: [
      "gear-meadow-crown", "gear-explorer-pack", "gear-acorn-shield", "gear-willow-wand", "gear-trail-boots", "gear-wizard-hat", "gear-starweave-scarf"
    ].map((item, index) => ({ id: `gear-${index}`, item, cost: 0, at: "2026-09-01T00:00:00Z" })), feeds: [], chests: [], layout: { slots: {}, equipped: {} } })), scope);
    await page.goto("/preview/child-surfaces.html?surface=my-hollow");
    await page.getByRole("button", { name: "My Guide", exact: true }).click();
    const gear = page.locator(".hollow-gear");
    await expect(gear).toHaveCount(7);
    expect(await cardContentFailures(gear)).toEqual([]);
    await expectControlPainted(gear.last());
    await page.getByRole("button", { name: "Change Guide", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Choose a Little Literacy Guide" });
    await expect(picker).toBeVisible();
    const choices = picker.locator(":scope > div > button");
    expect(await choices.count()).toBeGreaterThan(5);
    expect(await cardContentFailures(choices)).toEqual([]);
    await expectControlPainted(choices.last());
    await page.getByRole("button", { name: "Close guide choices", exact: true }).click();
    await expect(picker).toHaveCount(0);
  });
}

for (const surface of ["student-home", "reading-library", "my-hollow"]) {
  test(`${surface} retains complete card and navigation glyphs at 200% text`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.addInitScript(scope => localStorage.setItem(`lp-hollow:${scope}`, JSON.stringify({ purchases: [
      { id: "welcome", item: "egg-welcome", cost: 0, at: "2026-09-01T00:00:00Z" },
      { id: "bronze", item: "egg-bronze", cost: 100, at: "2026-09-02T00:00:00Z" }
    ], feeds: [], chests: [], layout: { slots: {}, equipped: {} } })), scope);
    await page.goto(`/preview/child-surfaces.html?surface=${surface}`);
    if (surface === "my-hollow") await page.getByRole("button", { name: "Beasties", exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    const enlarged = await enlargeText(page);
    expect(enlarged.length).toBeGreaterThan(20);
    expect(enlarged.filter(value => !Number.isFinite(value.after) || Math.abs(value.after - value.before * 2) >= .1)).toEqual([]);
    const cards = page.locator(surface === "student-home" ? ".kg-home-door" : surface === "reading-library" ? ".kg-book-card" : ".hollow-beastie");
    await testInfo.attach("enlarged-content.json", { body: Buffer.from(JSON.stringify(await cards.evaluateAll(nodes => nodes.slice(0, 25).map(node => ({
      title: node.querySelector(".kg-book-title, strong")?.textContent,
      cover: node.querySelector(".kg-book-cover") ? { height: node.querySelector(".kg-book-cover").getBoundingClientRect().height, minHeight: getComputedStyle(node.querySelector(".kg-book-cover")).minHeight } : null,
      fallback: node.querySelector(".kg-book-cover-fallback-art") ? { height: node.querySelector(".kg-book-cover-fallback-art").getBoundingClientRect().height, position: getComputedStyle(node.querySelector(".kg-book-cover-fallback-art")).position } : null
    }))), null, 2)), contentType: "application/json" });
    expect(await cardContentFailures(cards)).toEqual([]);
    const labels = surface === "student-home" ? cards.locator(".kg-card-title") : surface === "reading-library"
      ? cards.filter({ has: page.locator(".kg-book-title", { hasText: /Emperor Penguins and Their Relatives|Honeybees and Pollination/ }) }).locator(".kg-book-title")
      : cards.locator("strong");
    await expectTextInkPainted(labels);
    await expectControlPainted(cards.last());
    await expectTextInkPainted(page.locator(".kg-tab-label"));
    const geometry = await page.evaluate(() => ({ noHorizontal: document.documentElement.scrollWidth <= innerWidth + 1, noBodyScroll: document.documentElement.scrollHeight <= innerHeight + 1 }));
    expect(geometry).toEqual({ noHorizontal: true, noBodyScroll: true });
    await page.screenshot({ path: testInfo.outputPath(`${surface}-200-percent-text.png`) });
  });
}
