import { expect, test } from "@playwright/test";

const HARNESS = "/tests/fixtures/soundSeekersWordWorkbenchHarness.html";

async function slots(page) {
  return page.locator(".ss-workbench__sound-box").evaluateAll(nodes => nodes.map(node => ({
    state: node.getAttribute("data-slot-state"),
    text: node.textContent.trim(),
    current: node.getAttribute("aria-current")
  })));
}

async function controls(page) {
  return page.locator(".ss-workbench button:visible").evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return {
      label: node.getAttribute("aria-label"),
      x: box.x,
      y: box.y,
      right: box.right,
      bottom: box.bottom,
      width: box.width,
      height: box.height
    };
  }));
}

test("pointer placement emits one semantic intent and leaves controlled slots unchanged", async ({ page }) => {
  await page.goto(HARNESS);
  await expect(page.locator("[data-workbench-harness='task2-controlled-v2']")).toBeVisible();
  const before = await slots(page);
  await page.getByRole("button", { name: "sh grapheme tile" }).click();
  await expect.poll(() => page.evaluate(() => window.__soundSeekersWorkbenchInputs)).toEqual([
    { type: "place_tile", tileId: "workbench-ship-rack-sh" }
  ]);
  expect(await slots(page)).toEqual(before);
  await expect(page.getByRole("button", { name: "i grapheme tile" })).toBeVisible();

  await page.evaluate(() => window.__setSoundSeekersWorkbenchModel("ship-awaiting"));
  await expect(page.locator(".ss-workbench__sound-box[data-slot-state='filled']")).toHaveCount(1);
  await expect(page.locator(".ss-workbench__sound-box").first()).toContainText("sh");
  expect(await page.evaluate(() => window.__soundSeekersWorkbenchInputs)).toEqual([
    { type: "place_tile", tileId: "workbench-ship-rack-sh" }
  ]);
  const retained = page.getByRole("button", { name: "sh grapheme tile, placed" });
  await expect(retained).toHaveAttribute("aria-disabled", "true");
  await retained.focus();
  await expect(retained).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.__soundSeekersWorkbenchInputs)).toEqual([
    { type: "place_tile", tileId: "workbench-ship-rack-sh" }
  ]);
  await expect(page.getByRole("img", { name: "Sound box 1, sh, placed" })).toBeVisible();
});

test("keyboard and switch-compatible focus activate the same semantic buttons once", async ({ page }) => {
  await page.goto(HARNESS);
  const replay = page.getByRole("button", { name: "Hear the whole word again" });
  await replay.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.__soundSeekersWorkbenchReplays)).toEqual(["whole-word"]);

  const tile = page.getByRole("button", { name: "i grapheme tile" });
  await tile.focus();
  const focus = await tile.evaluate(node => {
    const style = getComputedStyle(node);
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  expect(focus.style).not.toBe("none");
  expect(focus.width).toBeGreaterThanOrEqual(3);
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => window.__soundSeekersWorkbenchInputs)).toEqual([
    { type: "place_tile", tileId: "workbench-ship-rack-i" }
  ]);
});

test.describe("touch input", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 320, height: 568 } });

  test("a touch activation emits the same one-intent transcript", async ({ page }) => {
    await page.goto(HARNESS);
    await page.getByRole("button", { name: "p grapheme tile" }).tap();
    await expect.poll(() => page.evaluate(() => window.__soundSeekersWorkbenchInputs)).toEqual([
      { type: "place_tile", tileId: "workbench-ship-rack-p" }
    ]);
  });
});

test("whole-word replay requests only replay and never exposes an answer cue", async ({ page }) => {
  await page.goto(HARNESS);
  await page.getByRole("button", { name: "Hear the whole word again" }).click();
  expect(await page.evaluate(() => window.__soundSeekersWorkbenchReplays)).toEqual(["whole-word"]);
  expect(await page.evaluate(() => window.__soundSeekersWorkbenchInputs)).toEqual([]);
  const html = await page.locator(".ss-workbench").evaluate(node => node.outerHTML);
  expect(html).not.toMatch(/expected-token|correct|answer|wordId|workbench-ship-challenge/iu);
  await expect(page.locator("audio, [data-audio-key], [data-sound-key]")).toHaveCount(0);
  await expect(page.getByRole("img", { name: "A large boat that carries people or things across water." })).toBeVisible();
});

test("post-commit meaning is immediate, replayable, and absent from the ordinary model", async ({ page }) => {
  await page.goto(HARNESS);
  await expect(page.getByText("A ship is a large boat made to travel on water.")).toHaveCount(0);
  await page.goto(`${HARNESS}?mode=meaning&motion=reduced`);
  await expect(page.getByRole("heading", { name: "ship" })).toBeVisible();
  await expect(page.getByText("A ship is a large boat made to travel on water.")).toBeVisible();
  await expect(page.getByLabel("A ship is a large boat made to travel on water.")).toBeVisible();
  await page.getByRole("button", { name: "Hear the meaning again" }).click();
  expect(await page.evaluate(() => window.__soundSeekersWorkbenchReplays)).toEqual(["meaning"]);
});

test("correction uses the controller transcript and selected contrast without component-authored fallback", async ({ page }) => {
  await page.goto(`${HARNESS}?mode=correction`);
  const status = page.getByRole("status");
  await expect(status).toHaveText("You chose ch. Listen to ch and sh, then try again.");
  await expect(status).toHaveAttribute("data-correction-mode", "retry");
  await expect(status).toHaveAttribute("data-replay-contrast", "true");
  await expect(status).toHaveAttribute("data-selected-contrast", "ch");
  await expect(page.getByText("Look at the highlighted sound box. Try again.")).toHaveCount(0);
});

test("the unscored morphology tile emits place_tile but pre-commit state never reveals the result", async ({ page }) => {
  await page.goto(`${HARNESS}?mode=morphology`);
  await expect(page.getByRole("heading", { name: "Try a word ending" })).toBeVisible();
  expect(await page.locator(".ss-workbench__instruction").evaluate(node => node.getBoundingClientRect().width))
    .toBeGreaterThanOrEqual(240);
  await expect(page.getByText("Practice only — no score")).toBeVisible();
  await expect(page.locator(".ss-workbench__morph-result")).toHaveCount(0);
  await page.getByRole("button", { name: "s grapheme tile" }).click();
  expect(await page.evaluate(() => window.__soundSeekersWorkbenchInputs)).toEqual([
    { type: "place_tile", tileId: "morphology-ending-tile" }
  ]);
  await expect(page.locator(".ss-workbench__morph-result")).toHaveCount(0);
  await page.evaluate(() => window.__setSoundSeekersWorkbenchModel("morphology-advanced"));
  await expect(page.getByRole("heading", { name: "Try a word ending" })).toBeVisible();
  await expect(page.locator(".ss-workbench__morph-result")).toHaveCount(0);
  await expect(page.getByText("more than one")).toHaveCount(0);
});

test("the power-owned blend state exposes one semantic sweep intent", async ({ page }) => {
  await page.goto(`${HARNESS}?mode=sweep`);
  await page.getByRole("button", { name: "Sweep and read the whole word" }).click();
  expect(await page.evaluate(() => window.__soundSeekersWorkbenchInputs)).toEqual([
    { type: "sweep_word" }
  ]);
});

for (const profile of [
  { name: "320px", viewport: { width: 320, height: 568 }, zoom: 1 },
  { name: "200% zoom", viewport: { width: 640, height: 1136 }, zoom: 2 }
]) {
  test(`controls and state remain reachable at ${profile.name}`, async ({ page, context }) => {
    await page.setViewportSize(profile.viewport);
    const cdp = await context.newCDPSession(page);
    await page.goto(`${HARNESS}?mode=meaning&motion=reduced`);
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: profile.zoom });
    const viewport = await page.evaluate(() => ({
      width: window.visualViewport?.width || innerWidth,
      height: window.visualViewport?.height || innerHeight,
      scale: window.visualViewport?.scale || 1,
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    }));
    expect(viewport.scale).toBe(profile.zoom);
    expect(viewport.overflow).toBeLessThanOrEqual(1);
    await expect(page.locator("[data-workbench-harness]"))
      .not.toHaveAttribute("style", /calc\(100vw/u);
    const boxes = await controls(page);
    expect(boxes.length).toBeGreaterThanOrEqual(6);
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
    for (let index = 1; index < boxes.length; index += 1) {
      const previous = boxes[index - 1];
      const horizontalGap = boxes[index].x - previous.right;
      const verticalGap = boxes[index].y - previous.bottom;
      expect(Math.max(horizontalGap, verticalGap)).toBeGreaterThanOrEqual(8);
    }
    const essentials = [
      page.getByRole("img", { name: "A large boat that carries people or things across water." }).first(),
      page.getByRole("heading", { name: "Choose the letter or letter team for this sound." }),
      page.getByRole("button", { name: "Hear the whole word again" }),
      page.getByRole("group", { name: "Sound boxes" }),
      page.getByRole("group", { name: "Grapheme tiles" }),
      page.getByRole("button", { name: "Hear the meaning again" })
    ];
    for (const item of essentials) {
      await item.evaluate(node => node.scrollIntoView({ block: "center", inline: "center" }));
      const visible = await item.evaluate(node => {
        const box = node.getBoundingClientRect();
        const view = window.visualViewport;
        const left = view?.offsetLeft || 0;
        const top = view?.offsetTop || 0;
        const width = view?.width || innerWidth;
        const height = view?.height || innerHeight;
        return box.right > left && box.left < left + width && box.bottom > top && box.top < top + height;
      });
      expect(visible).toBe(true);
    }
    await page.getByRole("button", { name: "Hear the whole word again" }).click();
    await expect.poll(() => page.evaluate(() => window.__soundSeekersWorkbenchReplays)).toEqual(["whole-word"]);
  });
}

test("reduced motion exposes the complete final state without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${HARNESS}?mode=meaning&motion=reduced`);
  await expect(page.getByRole("heading", { name: "ship" })).toBeVisible();
  const motion = await page.locator(".ss-workbench, .ss-meaning-payoff").evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { animation: style.animationName, transition: style.transitionDuration };
  }));
  for (const style of motion) {
    expect(style.animation).toBe("none");
    expect(style.transition).toBe("0s");
  }
});
