import { expect, test } from "@playwright/test";

const HARNESS = "/tests/fixtures/soundSeekersTask5UiHarness.html";

test("Task 5 modal owns focus, traps Tab, closes with Escape, and restores its opener", async ({ page }) => {
  await page.goto(HARNESS);
  const opener = page.getByRole("button", { name: "Game settings" });
  await opener.focus();
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "Game settings" });
  await expect(dialog).toBeVisible();
  const close = page.getByRole("button", { name: "Close game settings" });
  await expect(close).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Save and return" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("Task 5 map keeps semantic child copy readable and unclipped at genuine 200 percent zoom", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 640, height: 1136 },
    deviceScaleFactor: 1,
    hasTouch: false
  });
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await page.goto(HARNESS);
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await expect(page.locator("[data-sound-seekers-campaign-map]")).toBeVisible();

    expect(await page.evaluate(() => ({
      scale: window.visualViewport?.scale,
      width: Math.round(window.visualViewport?.width || 0),
      horizontalOverflow: Math.max(0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth)
    }))).toEqual({ scale: 2, width: 320, horizontalOverflow: 0 });

    const text = await page.locator([
      ".ss-map__chapter-header p",
      ".ss-map__chapter-header span",
      ".ss-map__objective",
      ".ss-map__stop-copy strong",
      ".ss-map__stop-copy small",
      ".ss-map__branch-memory"
    ].join(",")).evaluateAll(nodes => nodes.map(node => {
      const style = getComputedStyle(node);
      return {
        fontSize: Number.parseFloat(style.fontSize),
        clippedInline: node.scrollWidth > node.clientWidth + 1,
        clippedBlock: node.scrollHeight > node.clientHeight + 1,
        whiteSpace: style.whiteSpace,
        text: node.textContent.trim()
      };
    }));
    expect(text.length).toBeGreaterThan(40);
    for (const item of text) {
      expect(item.fontSize, item.text).toBeGreaterThanOrEqual(12);
      expect(item.clippedInline, item.text).toBe(false);
      expect(item.clippedBlock, item.text).toBe(false);
      expect(item.whiteSpace, item.text).not.toBe("nowrap");
    }

    const targets = await page.locator("button").evaluateAll(nodes => nodes
      .filter(node => !node.disabled)
      .map(node => {
        const box = node.getBoundingClientRect();
        return { width: box.width, height: box.height };
      }));
    for (const target of targets) {
      expect(target.width).toBeGreaterThanOrEqual(56);
      expect(target.height).toBeGreaterThanOrEqual(56);
    }
  } finally {
    await context.close();
  }
});

test("teach-all remains a polished readable lesson with reachable controls at genuine 200 percent zoom", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 640, height: 1136 },
    deviceScaleFactor: 1,
    hasTouch: false
  });
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await page.goto(`${HARNESS}?surface=teach`);
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await expect(page.locator(".ss-teach")).toBeVisible();

    expect(await page.evaluate(() => ({
      scale: window.visualViewport?.scale,
      width: Math.round(window.visualViewport?.width || 0),
      horizontalOverflow: Math.max(0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth)
    }))).toEqual({ scale: 2, width: 320, horizontalOverflow: 0 });

    const lessonText = await page.locator([
      ".ss-teach__instruction",
      ".ss-teach__cues dt",
      ".ss-teach__cues dd",
      ".ss-teach__anchor figcaption",
      ".ss-teach__units li",
      ".ss-teach__alternates h2",
      ".ss-teach__alternates li",
      ".ss-teach__controls p"
    ].join(",")).evaluateAll(nodes => nodes.map(node => ({
      fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
      clippedInline: node.scrollWidth > node.clientWidth + 1,
      clippedBlock: node.scrollHeight > node.clientHeight + 1,
      text: node.textContent.trim()
    })));
    expect(lessonText.length).toBeGreaterThanOrEqual(8);
    for (const item of lessonText) {
      expect(item.fontSize, item.text).toBeGreaterThanOrEqual(12);
      expect(item.clippedInline, item.text).toBe(false);
      expect(item.clippedBlock, item.text).toBe(false);
    }

    const grapheme = await page.locator(".ss-teach__grapheme").evaluate(node => ({
      fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height
    }));
    expect(grapheme.fontSize).toBeGreaterThanOrEqual(48);
    expect(grapheme.width).toBeGreaterThanOrEqual(72);
    expect(grapheme.height).toBeGreaterThanOrEqual(72);

    const image = await page.locator(".ss-teach__anchor img").evaluate(node => ({
      width: node.getBoundingClientRect().width,
      containerWidth: node.parentElement.getBoundingClientRect().width
    }));
    expect(image.width).toBeLessThanOrEqual(image.containerWidth + 1);

    const controls = await page.locator(".ss-teach__controls button").evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    expect(controls).toHaveLength(2);
    for (const control of controls) {
      expect(control.width).toBeGreaterThanOrEqual(56);
      expect(control.height).toBeGreaterThanOrEqual(56);
    }
  } finally {
    await context.close();
  }
});
