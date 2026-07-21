import { expect, test } from "@playwright/test";

const PREVIEW = "/preview/quest.html?sound=0&creature=showcase&adapt=0";

async function runtimeSnapshot(page) {
  return page.evaluate(() => window.__questPixelRuntime?.getLayoutSnapshot?.() || null);
}

async function holdKey(page, key, duration = 320) {
  await page.keyboard.down(key);
  try {
    await page.waitForTimeout(duration);
  } finally {
    await page.keyboard.up(key);
  }
  await page.waitForTimeout(80);
}

function boxesIntersect(left, right) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
}

function boxSeparation(left, right) {
  const horizontal = Math.max(
    left.x - (right.x + right.width),
    right.x - (left.x + left.width),
    0
  );
  const vertical = Math.max(
    left.y - (right.y + right.height),
    right.y - (left.y + left.height),
    0
  );
  return Math.hypot(horizontal, vertical);
}

for (const regression of [
  { name: "Hollow Tree", stopId: "s1", done: 0, target: "a", nextPrompt: "Find m" },
  { name: "Bramble Gate", stopId: "s5", done: 4, target: "c" },
  { name: "Forge Settlement branch", stopId: "s16", done: 15, target: "a" }
]) {
  test(`a child can physically collide with the correct ${regression.name} letter and advance`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${PREVIEW}&view=world&stop=${regression.stopId}&done=${regression.done}&display=pixel&active=0`);
    await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 15_000 });
    const originalPrompt = `Find ${regression.target}`;
    await expect(page.locator(`.qp-semantic-choices[aria-label='${originalPrompt}']`)).toBeAttached();
    await page.waitForFunction(() => window.__questPixelRuntime?.getLayoutSnapshot?.().choices?.length === 3);

    const firstSnapshot = await runtimeSnapshot(page);
    const target = firstSnapshot.choices.find(choice => choice.id.endsWith(`-${regression.target}`));
    expect(target, JSON.stringify(firstSnapshot.choices)).toBeTruthy();
    expect(firstSnapshot.choiceCorridorRadius).toBeGreaterThan(0);

    // Drive the actual Phaser player into the actual Phaser answer. This never
    // focuses, presses, clicks or otherwise invokes the hidden semantic answer.
    for (let step = 0; step < 80; step += 1) {
      const state = await runtimeSnapshot(page);
      const currentPrompt = await page.locator(".qp-semantic-choices").getAttribute("aria-label");
      if (currentPrompt !== originalPrompt) break;
      const liveTarget = state.choices.find(choice => choice.id === target.id);
      expect(liveTarget, JSON.stringify(state)).toBeTruthy();
      const dx = liveTarget.x - state.player.x;
      const dy = liveTarget.y - state.player.y;
      const keys = [];
      if (Math.abs(dx) > 3) keys.push(dx < 0 ? "ArrowLeft" : "ArrowRight");
      if (Math.abs(dy) > 3) keys.push(dy < 0 ? "ArrowUp" : "ArrowDown");
      for (const key of keys) await page.keyboard.down(key);
      await page.waitForTimeout(110);
      for (const key of keys.reverse()) await page.keyboard.up(key);
    }

    if (regression.nextPrompt) {
      await expect(page.locator(`.qp-semantic-choices[aria-label='${regression.nextPrompt}']`))
        .toBeAttached({ timeout: 5_000 });
    } else {
      await expect.poll(() => page.locator(".qp-semantic-choices").getAttribute("aria-label"), {
        timeout: 5_000
      }).not.toBe(originalPrompt);
    }
  });
}

test("all four keyboard arrows move the Beastie on their matching axis", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s6&done=5&display=pixel`);
  await page.getByRole("button", { name: "Let's go", exact: true }).click();
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => window.__questPixelRuntime?.getLayoutSnapshot?.().player);

  let before = await runtimeSnapshot(page);
  await holdKey(page, "ArrowUp");
  let after = await runtimeSnapshot(page);
  expect(after.player.y).toBeLessThan(before.player.y - 8);

  before = after;
  await holdKey(page, "ArrowDown");
  after = await runtimeSnapshot(page);
  expect(after.player.y).toBeGreaterThan(before.player.y + 8);

  before = after;
  await holdKey(page, "ArrowLeft");
  after = await runtimeSnapshot(page);
  expect(after.player.x).toBeLessThan(before.player.x - 8);

  before = after;
  await holdKey(page, "ArrowRight");
  after = await runtimeSnapshot(page);
  expect(after.player.x).toBeGreaterThan(before.player.x + 8);
});

test("coarse-pointer answer controls leave every D-pad arrow usable and moving", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  try {
    await page.goto(`${PREVIEW}&view=world&stop=s1&display=pixel&active=0`);
    await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 15_000 });
    const dpad = page.locator(".qp-dpad");
    const answers = page.locator(".qp-semantic-choices.is-pinned");
    await expect(dpad).toBeVisible();
    await expect(answers).toBeVisible();

    const [dpadBox, answerBox] = await Promise.all([dpad.boundingBox(), answers.boundingBox()]);
    expect(dpadBox).toBeTruthy();
    expect(answerBox).toBeTruthy();
    expect(answerBox.y + answerBox.height).toBeLessThanOrEqual(dpadBox.y - 8);

    for (const direction of ["up", "left", "down", "right"]) {
      const button = page.getByRole("button", { name: `Move ${direction}`, exact: true });
      const box = await button.boundingBox();
      expect(box).toBeTruthy();
      const hitLabel = await page.evaluate(({ x, y }) => (
        document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label") || null
      ), { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      expect(hitLabel).toBe(`Move ${direction}`);

      const before = await runtimeSnapshot(page);
      await button.click();
      await expect.poll(async () => {
        const after = await runtimeSnapshot(page);
        if (!after?.player || !before?.player) return false;
        if (direction === "up") return after.player.y < before.player.y - 3;
        if (direction === "down") return after.player.y > before.player.y + 3;
        if (direction === "left") return after.player.x < before.player.x - 3;
        return after.player.x > before.player.x + 3;
      }, { timeout: 2_500 }).toBe(true);
    }
  } finally {
    await context.close();
  }
});

for (const width of [568, 432, 424, 360]) {
  test(`${width}x320 phone landscape keeps the prompt, answers and D-pad separate`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width, height: 320 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    try {
      await page.goto(`${PREVIEW}&view=world&stop=s1&display=pixel&active=0`);
      await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 15_000 });

      const cue = page.locator(".qp-cue");
      const answers = page.locator(".qp-semantic-choices.is-pinned");
      const dpad = page.locator(".qp-dpad");
      await expect(cue).toBeVisible();
      await expect(answers).toBeVisible();
      await expect(dpad).toBeVisible();

      const [cueBox, answerBox, dpadBox] = await Promise.all([
        cue.boundingBox(),
        answers.boundingBox(),
        dpad.boundingBox()
      ]);
      expect(cueBox).toBeTruthy();
      expect(answerBox).toBeTruthy();
      expect(dpadBox).toBeTruthy();
      expect(boxesIntersect(answerBox, cueBox)).toBe(false);
      expect(boxesIntersect(answerBox, dpadBox)).toBe(false);
      expect(boxSeparation(answerBox, cueBox)).toBeGreaterThanOrEqual(8);
      expect(boxSeparation(answerBox, dpadBox)).toBeGreaterThanOrEqual(8);
    } finally {
      await context.close();
    }
  });
}
