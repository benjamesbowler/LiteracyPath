import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const PREVIEW = "/preview/quest.html?sound=0&creature=showcase&adapt=0";
mkdirSync(".artifacts/quest-release", { recursive: true });

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

async function expectNoSeriousAxeViolations(page) {
  let result;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator(".q-root")).toBeVisible();
      result = await new AxeBuilder({ page }).include(".q-root").analyze();
      break;
    } catch (error) {
      const navigationInterruptedScan = /execution context was destroyed|navigation/i.test(String(error));
      if (!navigationInterruptedScan || attempt > 0) throw error;
    }
  }
  if (!result) throw new Error("Accessibility scan did not return a result");
  const serious = result.violations.filter(item => ["serious", "critical"].includes(item.impact));
  expect(serious, serious.map(item => `${item.id}: ${item.help}`).join("\n")).toEqual([]);
}

async function expectVisibleButtonsReachable(page, minimumHeight = 44) {
  const viewport = page.viewportSize();
  const buttons = page.locator(".q-root button:visible");
  const failures = [];
  for (const button of await buttons.all()) {
    const inactive = await button.evaluate(element => Boolean(
      element.closest("[inert], [aria-hidden='true']")
    ));
    if (inactive) continue;
    const box = await button.boundingBox();
    if (!box) continue;
    if (box.height < minimumHeight || box.x < 0 || box.x + box.width > (viewport?.width || 0)) {
      failures.push({
        label: (await button.getAttribute("aria-label")) || (await button.textContent())?.trim(),
        x: Math.round(box.x),
        right: Math.round(box.x + box.width),
        height: Math.round(box.height)
      });
    }
  }
  expect(failures).toEqual([]);
}

async function activateCorrectSemanticChoice(page) {
  const group = page.locator(".qp-semantic-choices");
  await expect(group).toBeAttached();
  const prompt = await group.getAttribute("aria-label");
  let choice = group.getByRole("button").first();
  if (prompt?.startsWith("Find ")) {
    const target = prompt.slice("Find ".length);
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    choice = group.getByRole("button", { name: new RegExp(`^\\d+\\. ${escaped}$`) });
  }
  await expect(choice).toBeAttached();
  await choice.press("Enter");
}

async function walkToActiveResident(page, expectedPrompt = null, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  let lastSnapshot = null;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const snapshot = window.__questPixelRuntime.getLayoutSnapshot();
      return {
        snapshot,
        prompt: document.querySelector(".qp-semantic-choices")?.getAttribute("aria-label") || null
      };
    });
    lastSnapshot = state.snapshot;
    if (state.prompt && (!expectedPrompt || state.prompt === expectedPrompt)) return state.snapshot;

    const { player, resident } = state.snapshot;
    if (!player || !resident) {
      await page.waitForTimeout(80);
      continue;
    }
    const dx = resident.x - player.x;
    const dy = resident.y - player.y;
    const key = Math.abs(dx) >= Math.abs(dy)
      ? (dx < 0 ? "ArrowLeft" : "ArrowRight")
      : (dy < 0 ? "ArrowUp" : "ArrowDown");
    await page.keyboard.down(key);
    try {
      await page.waitForTimeout(90);
    } finally {
      await page.keyboard.up(key);
    }
  }
  throw new Error(`Could not reach the active resident: ${JSON.stringify(lastSnapshot)}`);
}

test("a failed pixel-world chunk recovers into the bundled 2D trail", async ({ page }) => {
  await page.route("**/src/components/quest/world/QuestPixelWorld.jsx*", route => route.abort());
  await page.goto(`${PREVIEW}&view=world&stop=s1&display=pixel&active=0`);

  await expect(page.getByRole("group", { name: "Find a" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".q2d-root")).toBeVisible();
  await expect(page.getByText("Something went wrong", { exact: false })).toHaveCount(0);
});

test("accessible trail keeps its prompt and child-sized controls at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s7&done=6&display=2d&active=0`);

  await expect(page.getByRole("group", { name: "Find j" })).toBeVisible();
  const choices = page.locator(".q2d-choices button");
  await expect(choices).toHaveCount(3);
  for (const choice of await choices.all()) {
    const box = await choice.boundingBox();
    expect(box?.width || 0).toBeGreaterThanOrEqual(44);
    expect(box?.height || 0).toBeGreaterThanOrEqual(44);
    expect(box?.x || 0).toBeGreaterThanOrEqual(0);
    expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  }
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the authored Seedwake resident remains legible in the 320-pixel accessible game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s1&display=2d&active=0`);

  await expect(page.locator(".q2d-resident > span", { hasText: "Moss" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Find a" })).toBeVisible();
  const resident = page.locator(".q2d-resident > i");
  await expect(resident).toBeVisible();
  const box = await resident.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(64);
  expect(box?.height || 0).toBeGreaterThanOrEqual(64);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the authored River Gardens cast remains legible in the 320-pixel accessible game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s6&done=5&display=2d&active=0`);

  await expect(page.locator(".q2d-resident > span", { hasText: "Fizz" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Find x" })).toBeVisible();
  const resident = page.locator(".q2d-resident > i");
  await expect(resident).toBeVisible();
  const box = await resident.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(64);
  expect(box?.height || 0).toBeGreaterThanOrEqual(64);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the authored Fossil Canyon cast remains legible in the 320-pixel accessible game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s11&done=10&display=2d&active=0`);

  await expect(page.locator(".q2d-resident > span", { hasText: "Rook" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Find nk" })).toBeVisible();
  const resident = page.locator(".q2d-resident > i");
  await expect(resident).toBeVisible();
  const box = await resident.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(64);
  expect(box?.height || 0).toBeGreaterThanOrEqual(64);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the authored Forge Settlement cast remains legible in the 320-pixel accessible game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s16&done=15&display=2d&active=0`);

  await expect(page.locator(".q2d-resident > span", { hasText: "Bolt" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Find a" })).toBeVisible();
  const resident = page.locator(".q2d-resident > i");
  await expect(resident).toBeVisible();
  const box = await resident.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(64);
  expect(box?.height || 0).toBeGreaterThanOrEqual(64);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("Forge sorting keeps its machine, cast, and moving answers in separate safe bays", async ({ page }) => {
  await page.addInitScript(() => {
    window.__questFeedbackSeen = [];
    new MutationObserver(() => {
      const feedback = document.querySelector(".qp-cue.has-feedback strong")?.textContent?.trim();
      if (feedback) window.__questFeedbackSeen.push(feedback);
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });

  const verifyLayout = async screenshotPath => {
    await page.waitForFunction(() => (
      window.__questPixelRuntime?.getLayoutSnapshot?.().choices?.length === 3
    ));
    const snapshot = await page.evaluate(() => window.__questPixelRuntime.getLayoutSnapshot());
    expect(snapshot.player).toBeTruthy();
    expect(snapshot.resident).toBeTruthy();
    expect(snapshot.decor).toBeTruthy();
    expect(snapshot.choices).toHaveLength(3);

    for (const choice of snapshot.choices) {
      const playerClearance = Math.hypot(
        choice.x - snapshot.player.x,
        choice.y - snapshot.player.y
      ) - choice.radius;
      const residentClearance = Math.hypot(
        choice.x - snapshot.resident.x,
        choice.y - snapshot.resident.y
      ) - choice.radius;
      expect(playerClearance).toBeGreaterThanOrEqual(22);
      expect(residentClearance).toBeGreaterThanOrEqual(22);
      expect(choice.x - choice.radius).toBeGreaterThanOrEqual(snapshot.camera.left);
      expect(choice.x + choice.radius).toBeLessThanOrEqual(snapshot.camera.right);
    }
    for (let first = 0; first < snapshot.choices.length; first += 1) {
      for (let second = first + 1; second < snapshot.choices.length; second += 1) {
        const a = snapshot.choices[first];
        const b = snapshot.choices[second];
        const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius;
        expect(gap, JSON.stringify(snapshot)).toBeGreaterThanOrEqual(2);
      }
    }
    await page.screenshot({ path: screenshotPath });
  };

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s17&done=16&display=pixel&active=0`);
  await expect(page.getByRole("button", { name: "3. a" })).toBeVisible();
  await page.waitForTimeout(3200);
  expect(await page.evaluate(() => window.__questFeedbackSeen)).toEqual([]);
  await verifyLayout(".artifacts/quest-release/forge-sorting-desktop.png");
  await page.getByRole("button", { name: "3. a" }).press("Enter");
  await expect(page.getByText("Tip it into the hopper", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}&view=world&stop=s17&done=16&display=pixel&active=0`);
  await expect(page.getByRole("button", { name: "3. a" })).toBeVisible();
  await page.waitForTimeout(3200);
  expect(await page.evaluate(() => window.__questFeedbackSeen)).toEqual([]);
  await verifyLayout(".artifacts/quest-release/forge-sorting-phone.png");
  const tallyContainsText = await page.locator(".qp-tally").evaluate(element => (
    element.scrollWidth <= element.clientWidth
    && [...element.querySelectorAll("span, small")].every(child => child.scrollWidth <= child.clientWidth)
  ));
  expect(tallyContainsText).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("continuous movement keeps the customised Beastie visible, animated, and inside the camera", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s6&done=5&display=pixel`);
  await page.getByRole("button", { name: "Let's go", exact: true }).click();
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 10_000 });
  await page.waitForFunction(() => window.__questPixelRuntime?.getLayoutSnapshot?.().player);

  const initial = await page.evaluate(() => window.__questPixelRuntime.getLayoutSnapshot());
  await page.keyboard.down("ArrowUp");
  try {
    await expect.poll(() => page.evaluate(() => window.__questPixelRuntime.getLayoutSnapshot()), {
      timeout: 3_000
    }).toMatchObject({
      player: {
        visible: true,
        active: true,
        alpha: 1,
        animation: "beastie-up",
        animationPlaying: true
      }
    });
    await expect.poll(() => page.evaluate(() => window.__questPixelRuntime.getLayoutSnapshot().player.y), {
      timeout: 3_000
    }).toBeLessThan(initial.player.y - 12);
  } finally {
    await page.keyboard.up("ArrowUp");
  }

  const moving = await page.evaluate(() => window.__questPixelRuntime.getLayoutSnapshot());
  expect(moving.player.x).toBeGreaterThan(moving.camera.left);
  expect(moving.player.x).toBeLessThan(moving.camera.right);
  expect(moving.player.y).toBeGreaterThan(moving.camera.top);
  expect(moving.player.y).toBeLessThan(moving.camera.bottom);
  expect(moving.camera.zoom).toBeGreaterThan(1);
});

test("a completed River task can flow directly into the next resident encounter", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s6&done=5&display=pixel&active=0`);
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 10_000 });

  await activateCorrectSemanticChoice(page);
  await expect(page.locator(".qp-semantic-choices[aria-label='Carry it to the sluice']")).toBeAttached();
  await activateCorrectSemanticChoice(page);
  await expect(page.locator(".qp-semantic-choices[aria-label='Find e']")).toBeAttached();
  await activateCorrectSemanticChoice(page);
  await expect(page.locator(".qp-semantic-choices[aria-label='Carry it to the sluice']")).toBeAttached();
  await activateCorrectSemanticChoice(page);
  await expect(page.locator(".qp-progress")).toHaveAttribute("aria-label", "1 of 2 trail tasks complete");

  await walkToActiveResident(page, "Find k");

  const snapshot = await page.evaluate(() => window.__questPixelRuntime.getLayoutSnapshot());
  expect(snapshot.encounter.activeId).toBe("s6-1");
  expect(snapshot.encounter.latch).toBe("s6-1");
  expect(snapshot.choices).toHaveLength(3);
});

test("all forty stops consume distinct authored routes in the live renderer", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const signatures = [];
  for (let stop = 1; stop <= 40; stop += 1) {
    await page.goto(`${PREVIEW}&view=world&stop=s${stop}&done=${stop - 1}&display=pixel&active=0`);
    await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 10_000 });
    await page.waitForFunction(() => window.__questPixelRuntime?.getLayoutSnapshot?.().map);
    const snapshot = await page.evaluate(() => window.__questPixelRuntime.getLayoutSnapshot());
    expect(snapshot.map.stopId).toBe(`s${stop}`);
    expect(snapshot.map.authorship).toBe("route-authored");
    expect(snapshot.map.routeSignature).toHaveLength(5);
    expect(snapshot.map.landmarkAnchor).toBeTruthy();
    signatures.push(snapshot.map.routeSignature.join(":"));
  }
  expect(new Set(signatures).size).toBe(40);
});

test("Claw Pass signal relays advance through the accessible controls without freezing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s15&done=14&display=pixel&active=0`);
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 10_000 });

  await expect(page.locator(".qp-semantic-choices[aria-label='Find a']")).toBeAttached();
  await activateCorrectSemanticChoice(page);
  await expect(page.locator(".qp-semantic-choices[aria-label='Stand on the glowing relay']")).toBeAttached();

  await activateCorrectSemanticChoice(page);
  await expect(page.locator(".qp-semantic-choices[aria-label='Send the final signal']")).toBeAttached();

  await activateCorrectSemanticChoice(page);
  await expect.poll(() => page.evaluate(() => {
    const snapshot = window.__questPixelRuntime.getLayoutSnapshot();
    return {
      activeId: snapshot.encounter.activeId,
      playerActive: snapshot.player?.active,
      playerVisible: snapshot.player?.visible
    };
  })).toEqual({ activeId: "s15-1", playerActive: true, playerVisible: true });

  await walkToActiveResident(page);
  await expect(page.locator(".qp-semantic-choices")).toBeAttached();
  await expect.poll(() => page.evaluate(() => (
    window.__questPixelRuntime.getLayoutSnapshot().choices.length
  ))).toBeGreaterThan(0);
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible();
});

test("the Singing Weir keeps every answer below the real instruction HUD", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s10&done=9&display=pixel&active=0`);
  const choices = page.locator(".qp-semantic-choices[aria-label='Find th']");
  await expect(choices).toBeAttached();
  await expect(choices.getByRole("button", { name: /^\d+\. th$/ })).toBeVisible();
  await page.waitForFunction(() => window.__questPixelRuntime?.getLayoutSnapshot?.().choices?.length === 3);
  await page.waitForTimeout(1200);

  const [snapshot, canvasBox, promptBox] = await Promise.all([
    page.evaluate(() => window.__questPixelRuntime.getLayoutSnapshot()),
    page.locator(".qp-canvas canvas").boundingBox(),
    page.locator(".qp-cue").boundingBox()
  ]);
  expect(canvasBox).toBeTruthy();
  expect(promptBox).toBeTruthy();
  const promptBottom = promptBox.y + promptBox.height + 8;
  const screenScaleY = canvasBox.height / (snapshot.camera.bottom - snapshot.camera.top);
  for (const choice of snapshot.choices) {
    expect(choice.bounds).toBeTruthy();
    const screenTop = canvasBox.y + ((choice.bounds.top - snapshot.camera.top) * screenScaleY);
    expect(screenTop, JSON.stringify({ choice, snapshot, promptBox })).toBeGreaterThanOrEqual(promptBottom);
  }
});

test("the authored Glass Marsh cast remains legible in the 320-pixel accessible game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s21&done=20&display=2d&active=0`);

  await expect(page.locator(".q2d-resident > span", { hasText: "Ripple" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Find ue" })).toBeVisible();
  const resident = page.locator(".q2d-resident > i");
  await expect(resident).toBeVisible();
  const box = await resident.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(64);
  expect(box?.height || 0).toBeGreaterThanOrEqual(64);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the authored Storm Coast cast remains legible in the 320-pixel accessible game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s26&done=25&display=2d&active=0`);

  await expect(page.locator(".q2d-resident > span", { hasText: "Kelp" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Find oa" })).toBeVisible();
  const resident = page.locator(".q2d-resident > i");
  await expect(resident).toBeVisible();
  const box = await resident.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(64);
  expect(box?.height || 0).toBeGreaterThanOrEqual(64);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the authored Lantern Forest cast remains legible in the 320-pixel accessible game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s31&done=30&display=2d&active=0`);

  await expect(page.locator(".q2d-resident > span", { hasText: "Luma" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Find ar" })).toBeVisible();
  const resident = page.locator(".q2d-resident > i");
  await expect(resident).toBeVisible();
  const box = await resident.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(64);
  expect(box?.height || 0).toBeGreaterThanOrEqual(64);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the authored Star Reach cast remains legible in the 320-pixel accessible game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s36&done=35&display=2d&active=0`);

  await expect(page.locator(".q2d-resident > span", { hasText: "Comet" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Find ure" })).toBeVisible();
  const resident = page.locator(".q2d-resident > i");
  await expect(resident).toBeVisible();
  const box = await resident.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(64);
  expect(box?.height || 0).toBeGreaterThanOrEqual(64);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the completed Star Reach map keeps all five authored landmarks inside a 320-pixel screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=map&stop=s40&done=40&display=pixel`);

  await expect(page.getByRole("heading", { name: "Star Reach" })).toBeVisible();
  await expect(page.getByText("Whole trail restored", { exact: true })).toBeVisible();
  const landmarks = page.locator(".q-map-stop-landmark");
  await expect(landmarks).toHaveCount(5);
  for (const landmark of await landmarks.all()) {
    await expect(landmark).toBeVisible();
    const loaded = await landmark.evaluate(image => image.complete && image.naturalWidth > 0);
    expect(loaded).toBe(true);
    const box = await landmark.boundingBox();
    expect(box?.x || 0).toBeGreaterThanOrEqual(0);
    expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  }
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("a restored chapter exposes its earned shortcut and launches the named review route", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}&view=map&stop=s5&done=5&display=pixel`);

  const shortcut = page.getByRole("button", {
    name: "Lantern Run. Follow the flowers between restored gardens.",
    exact: true
  });
  await expect(shortcut).toBeVisible();
  const shortcutBox = await shortcut.boundingBox();
  expect(shortcutBox?.x || 0).toBeGreaterThanOrEqual(0);
  expect((shortcutBox?.x || 0) + (shortcutBox?.width || 0)).toBeLessThanOrEqual(390);
  await shortcut.click();
  await expect(page.locator(".qp-place > span", { hasText: "Lantern Run" })).toBeVisible();
  await expect(page.locator(".qp-root")).toHaveAttribute("data-world", "meadow");
});

test("accessible play performs and checkpoints a restored resident memory", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}&view=world&stop=s5&done=4&display=2d&active=0`);

  const memory = page.getByRole("button", { name: "Visit Moss at the restored trail", exact: true });
  await expect(memory).toBeVisible();
  await memory.click();
  const story = page.locator(".q2d-memory-story");
  await expect(story).toContainText("The seeds you woke are lighting new sound paths.");
  await expect(story).toContainText("Lantern flowers now mark the return lane.");
  await expect(page.getByRole("button", { name: "Close restored trail story", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
  const checkpoint = await page.evaluate(() => JSON.parse(localStorage.getItem("lp-quest:preview") || "null"));
  expect(checkpoint?.checkpoint?.visitedMemoryIds).toContain("restored-s1");
});

test("the Singing Weir gate crosses directly into the River Gardens ceremony", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s10&done=9&display=pixel&checkpoint=gate`);

  const world = page.locator(".qp-root[data-ready='true']");
  await expect(world).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Walk through the open gate")).toBeVisible();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".qp-root[data-ceremony='true']")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.up("ArrowUp");
  await expect(page.getByText("Everyone made it to The Singing Weir")).toBeVisible();
});

test("the Claw Pass rib arch crosses directly into the Fossil Canyon ceremony", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s15&done=14&display=pixel&checkpoint=gate`);

  const world = page.locator(".qp-root[data-ready='true']");
  await expect(world).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Walk through the open gate")).toBeVisible();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".qp-root[data-ceremony='true']")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.up("ArrowUp");
  await expect(page.getByText("Everyone made it to Claw Pass")).toBeVisible();
});

test("the Word Forge gate crosses directly into the Forge Settlement ceremony", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s20&done=19&display=pixel&checkpoint=gate`);

  const world = page.locator(".qp-root[data-ready='true']");
  await expect(world).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Walk through the open gate")).toBeVisible();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".qp-root[data-ceremony='true']")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.up("ArrowUp");
  await expect(page.getByText("Everyone made it to The Word Forge")).toBeVisible();
});

test("the Mirror Fen beacon crosses directly into the Glass Marsh ceremony", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s25&done=24&display=pixel&checkpoint=gate`);

  const world = page.locator(".qp-root[data-ready='true']");
  await expect(world).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Walk through the open gate")).toBeVisible();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".qp-root[data-ceremony='true']")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.up("ArrowUp");
  await expect(page.getByText("Everyone made it to Mirror Fen")).toBeVisible();
});

test("the Thunder Lighthouse gate crosses directly into the Storm Coast ceremony", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s30&done=29&display=pixel&checkpoint=gate`);

  const world = page.locator(".qp-root[data-ready='true']");
  await expect(world).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Walk through the open gate")).toBeVisible();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".qp-root[data-ceremony='true']")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.up("ArrowUp");
  await expect(page.getByText("Everyone made it to Thunder Lighthouse")).toBeVisible();
});

test("the Sleeping Observatory gate rewards Lantern Forest and hands off to Star Reach", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s35&done=34&display=pixel&checkpoint=gate`);

  const world = page.locator(".qp-root[data-ready='true']");
  await expect(world).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Walk through the open gate")).toBeVisible();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".qp-root[data-ceremony='true']")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.up("ArrowUp");
  await expect(page.getByText("Everyone made it to The Sleeping Observatory")).toBeVisible();

  const reward = page.getByRole("dialog", { name: "The Sleeping Observatory reward" });
  await expect(reward).toBeVisible({ timeout: 6_000 });
  await expect(reward.getByText("Living Lantern Map", { exact: true })).toBeVisible();
  await expect(reward.getByText("Echo", { exact: true })).toBeVisible();
  await expect(reward.getByText("Luma", { exact: true })).toBeVisible();
  await expect(reward.getByText("Wisp", { exact: true })).toBeVisible();
  await expect(reward.getByText("Orbit", { exact: true })).toBeVisible();
  await reward.getByRole("button", { name: "Continue the trail" }).click();
  const nextWorld = page.locator(".q-journey-layer.is-active .qp-root[data-ready='true']");
  await expect(nextWorld).toBeVisible();
  await expect(nextWorld.locator(".qp-place > span")).toHaveText("Star Reach");
  await expect(nextWorld.locator(".qp-place > strong")).toHaveText("Comet Stair");
  await expect(nextWorld.getByRole("button", { name: "Let's go", exact: true })).toBeVisible();
});

test("the First Reading Star gate completes the journey without freezing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s40&done=39&display=pixel&checkpoint=gate`);

  const world = page.locator(".qp-root[data-ready='true']");
  await expect(world).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Walk through the open gate")).toBeVisible();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".qp-root[data-ceremony='true']")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.up("ArrowUp");
  await expect(page.getByText("Everyone made it to The First Reading Star")).toBeVisible();

  const reward = page.getByRole("dialog", { name: "The First Reading Star reward" });
  await expect(reward).toBeVisible({ timeout: 6_000 });
  await expect(reward.getByRole("heading", { name: "The First Reading Star" })).toBeVisible();
  await expect(reward.getByText("First Reading Star", { exact: true })).toBeVisible();
  await expect(reward.getByText("Illuminates every restored landmark", { exact: true })).toBeVisible();
  await expect(reward.getByText("Nova", { exact: true })).toBeVisible();
  await expect(reward.getByText("Comet", { exact: true })).toBeVisible();
  await expect(reward.getByText("Aster", { exact: true })).toBeVisible();
  await expect(reward.getByText("Dawn", { exact: true })).toBeVisible();
  await reward.getByRole("button", { name: "Continue the trail" }).click();

  await expect(page.getByRole("heading", { name: "Star Reach" })).toBeVisible();
  await expect(page.getByText("Whole trail restored", { exact: true })).toBeVisible();
  await expect(page.getByText("Journey complete", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "The First Reading Star, 3 stars" })).toBeEnabled();
});

test("an auto-advancing chapter reward moves focus to Continue", async ({ page }) => {
  await page.goto(`${PREVIEW}&view=ceremony&stop=s5&done=5&display=2d`);
  const reward = page.getByRole("dialog", { name: "Bramble Gate reward" });
  await expect(reward).toBeVisible({ timeout: 5_000 });
  const continueButton = reward.getByRole("button", { name: "Continue the trail" });
  await expect(continueButton).toBeVisible({ timeout: 6_000 });
  await expect(continueButton).toBeFocused();
});

test("Show rewards now hands focus to the revealed Continue action", async ({ page }) => {
  await page.goto(`${PREVIEW}&view=ceremony&stop=s5&done=5&display=2d`);
  const reward = page.getByRole("dialog", { name: "Bramble Gate reward" });
  const showNow = reward.getByRole("button", { name: "Show rewards now" });
  await expect(showNow).toBeVisible({ timeout: 5_000 });
  await showNow.press("Enter");
  const continueButton = reward.getByRole("button", { name: "Continue the trail" });
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toBeFocused();
});

test("a mounted reward stops staged motion when the OS preference changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${PREVIEW}&view=ceremony&stop=s5&done=5&display=2d`);
  const reward = page.getByRole("dialog", { name: "Bramble Gate reward" });
  await expect(reward.getByRole("button", { name: "Show rewards now" })).toBeVisible();
  await expect(reward.locator("canvas")).toHaveCount(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(reward.locator("canvas")).toHaveCount(0);
  const continueButton = reward.getByRole("button", { name: "Continue the trail" });
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toBeFocused();

  // Returning to no-preference must not replay a ceremony the child already saw.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(1200);
  await expect(continueButton).toBeVisible();
  await expect(reward.getByRole("button", { name: "Show rewards now" })).toHaveCount(0);
});

test("shared mounted confetti follows live OS reduced-motion changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/preview/home.html?view=confetti");
  const preview = page.locator("[data-preview='confetti']");
  await expect(preview.locator("canvas")).toHaveCount(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(preview.locator("canvas")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(preview.locator("canvas")).toHaveCount(1);
  await preview.getByRole("button", { name: "Unmount confetti" }).click();
  await expect(preview.locator("canvas")).toHaveCount(0);
});

test("the 320-pixel gate keeps its required action reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s7&done=6&display=2d&checkpoint=gate`);

  const walkThrough = page.getByRole("button", { name: "Walk through" });
  await expect(walkThrough).toBeVisible();
  await walkThrough.scrollIntoViewIfNeeded();
  const box = await walkThrough.boundingBox();
  expect(box?.height || 0).toBeGreaterThanOrEqual(44);
  expect(box?.x || 0).toBeGreaterThanOrEqual(0);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(320);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("Trading Post reflows at the 640 CSS pixels produced by 200 percent zoom", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 720 });
  await page.goto(`${PREVIEW}&view=post&done=5`);

  await expect(page.getByRole("heading", { name: "Trading Post" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Crest" })).toBeVisible();
  await expect(page.getByRole("tabpanel")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("automatic mode avoids the pixel engine on a genuinely constrained device", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 1 });
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 1 });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${PREVIEW}&view=world&stop=s36&done=35&display=auto&active=0`);

  await expect(page.locator(".q2d-root")).toBeVisible();
  await expect(page.locator(".qp-root")).toHaveCount(0);
  const pixelEngineRequests = await page.evaluate(() => performance.getEntriesByType("resource")
    .map(entry => entry.name)
    .filter(name => name.includes("QuestPixelWorld") || name.includes("questPixelRuntime")));
  expect(pixelEngineRequests).toEqual([]);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("the retired Den route opens the real map and character edits return there", async ({ page }) => {
  await page.goto(`${PREVIEW}&view=den&display=2d`);
  const mapHeading = page.locator(".q-map-v2 h1");
  await expect(mapHeading).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your Den" })).toHaveCount(0);

  await page.getByRole("button", { name: "Character" }).click();
  await expect(page.getByRole("heading", { name: "Change your book character" })).toBeFocused();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(mapHeading).toBeVisible();
  await expect(mapHeading).toBeFocused();
});

test("the mounted pixel world follows live OS reduced-motion changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${PREVIEW}&view=world&stop=s1&done=0&display=pixel&active=0`);
  await expect(page.locator(".qp-root")).toBeVisible();
  const runtimeHasModel = () => page.evaluate(() => Boolean(
    window.__questPixelRuntime?.game?.scene?.scenes?.[0]?.model
  ));
  const runtimeReducedMotion = () => page.evaluate(() => Boolean(
    window.__questPixelRuntime?.game?.scene?.scenes?.[0]?.model?.reducedMotion
  ));
  await expect.poll(runtimeHasModel).toBe(true);
  await expect.poll(runtimeReducedMotion).toBe(false);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(runtimeReducedMotion).toBe(true);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(runtimeReducedMotion).toBe(false);
});

test("replaying the letter trace demo uses recorded gold-voice instructions", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.__tracerPlayedAudio = [];
    window.Audio = class TestAudio extends EventTarget {
      constructor(src) {
        super();
        this.src = String(src || "");
        this.currentTime = 0;
        this.volume = 1;
      }

      play() {
        window.__tracerPlayedAudio.push(new URL(this.src, window.location.href).pathname);
        window.setTimeout(() => this.dispatchEvent(new Event("ended")), 5);
        return Promise.resolve();
      }

      pause() {}
    };
  });
  await page.goto("/preview/home.html?view=tracer&letter=a");
  await expect(page.getByRole("heading", { name: "Trace the Letter" })).toBeVisible();

  await page.getByRole("button", { name: "Skip" }).click();
  await expect.poll(() => page.evaluate(() => window.__tracerPlayedAudio || [])).toContain(
    "/audio/production/en-US/supplemental/now-you-try-7d307f3512.mp3"
  );
  const replay = page.getByRole("button", { name: "Show me" });
  await expect(replay).toBeVisible();
  await page.evaluate(() => { window.__tracerPlayedAudio = []; });
  await replay.click();
  await expect.poll(() => page.evaluate(() => window.__tracerPlayedAudio || [])).toEqual([
    "/audio/production/en-US/supplemental/watch-me-first-bd61e23b42.mp3",
    "/audio/production/en-US/supplemental/start-at-the-top-16d920afb1.mp3",
    "/audio/production/en-US/supplemental/now-you-try-7d307f3512.mp3"
  ]);
  expect(pageErrors).toEqual([]);
});

test("the phonics trace step has a keyboard and switch-completable path", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/home.html?view=tracer&letter=a");
  const firstStroke = page.getByRole("button", { name: "Trace stroke 1 of 2" });
  await expect(firstStroke).toBeVisible();
  await firstStroke.focus();
  await page.keyboard.press("Enter");

  const secondStroke = page.getByRole("button", { name: "Trace stroke 2 of 2" });
  await expect(secondStroke).toBeFocused();
  await page.keyboard.press("Enter");

  const nextStep = page.getByRole("button", { name: "Next Step" });
  await expect(nextStep).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Trace step complete");
});

test("settings remains modal when native dialog methods are unavailable", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: undefined
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value: undefined
    });
  });
  await page.goto(`${PREVIEW}&view=den&display=2d`);
  const trigger = page.getByRole("button", { name: "Open settings" });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const settings = page.getByRole("dialog", { name: "Display, sound and access" });
  await expect(settings).toBeVisible();
  await expect(settings).toHaveAttribute("data-fallback-modal", "true");
  await expect(settings).toHaveAttribute("aria-modal", "true");
  await expect(page.locator(".q-den-panel")).toHaveAttribute("inert", "");
  const close = settings.getByRole("button", { name: "Close settings" });
  const done = settings.getByRole("button", { name: "Done" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(done).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator(".q-den-panel")).not.toHaveAttribute("inert", "");
  expect(pageErrors).toEqual([]);
});

test("a local-storage quota failure warns before the child closes the quest", async ({ page }) => {
  await page.goto(`${PREVIEW}&view=world&stop=s1&done=0&display=2d&active=0`);
  await expect(page.locator(".q2d-choices button").first()).toBeVisible();
  await page.evaluate(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (key === "lp-quest:preview") {
        throw new DOMException("The quota has been exceeded", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  });

  await page.locator(".q2d-choices button").first().click();
  await expect(page.getByText("Progress may not be saving on this device", { exact: false }))
    .toBeVisible({ timeout: 5_000 });
});

test("a cloud-queue storage failure is surfaced instead of silently dropping the save", async ({ page, context }) => {
  await page.goto(`${PREVIEW}&view=world&stop=s1&done=0&display=2d&active=0&sync=1`);
  await expect(page.locator(".q2d-choices button").first()).toBeVisible();
  await page.evaluate(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (key.startsWith("lp-progress-sync-entry-v2:")) {
        throw new DOMException("The quota has been exceeded", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await context.setOffline(true);
  await page.locator(".q2d-choices button").first().click();

  await expect(page.getByText("Progress may not be saving or backing up", { exact: false }))
    .toBeVisible({ timeout: 5_000 });
  await context.setOffline(false);
});

test("two open tabs preserve each other's forward quest progress", async ({ page, context }) => {
  const sibling = await context.newPage();
  const url = `${PREVIEW}&view=world&stop=s1&done=0&display=2d&active=0`;
  await Promise.all([page.goto(url), sibling.goto(url)]);
  await expect(page.locator(".q2d-choices button").first()).toBeVisible();
  await expect(sibling.locator(".q2d-choices button").first()).toBeVisible();

  await page.evaluate(() => {
    const key = "lp-quest:preview";
    const state = JSON.parse(localStorage.getItem(key));
    state.trail = { ...state.trail, stopsDone: [...new Set([...(state.trail?.stopsDone || []), "s40"])] };
    localStorage.setItem(key, JSON.stringify(state));
  });
  await expect.poll(() => sibling.evaluate(() => (
    JSON.parse(localStorage.getItem("lp-quest:preview"))?.trail?.stopsDone || []
  ))).toContain("s40");

  await sibling.locator(".q2d-choices button").first().click();
  await expect.poll(() => sibling.evaluate(() => (
    JSON.parse(localStorage.getItem("lp-quest:preview"))?.trail?.stopsDone || []
  )), { timeout: 5_000 }).toContain("s40");
  await sibling.close();
});

test("start again survives a stale cloud hydrate, close, reopen, and full reload", async ({ page }) => {
  const scope = "reset-reentry-regression";
  const storageKey = `lp-quest:${scope}`;
  const url = `/preview/quest-preview.html?scope=${scope}&sound=0`;

  // Establish the preview origin, then seed a save with every class of state
  // that the child-facing reset promises to clear.
  await page.goto(`${PREVIEW}&view=den&display=2d`);
  const played = await page.evaluate(async key => {
    const { baseQuestState } = await import("/src/utils/questProgress.js");
    const state = {
      ...baseQuestState(),
      hatched: true,
      trail: {
        stopsDone: ["s1", "s2"],
        stars: { s1: 3, s2: 2 },
        drops: { s1: 4 },
        routeCursor: 3
      },
      mastery: { s: { seen: 8, correct: 7, state: "mastered" } },
      stones: ["s"],
      ledger: { purchases: [{ id: "leaf-cap", at: "2026-07-20T08:00:00Z" }] },
      checkpoint: { stopId: "s3", beatIndex: 1 },
      settings: { ...baseQuestState().settings, highContrast: true },
      settingsAt: "2026-07-20T09:00:00Z"
    };
    localStorage.setItem(key, JSON.stringify(state));
    return state;
  }, storageKey);

  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Your Den" })).toBeVisible();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Start the adventure again" }).click();
  await page.getByRole("button", { name: "Yes, start again" }).click();
  await expect(page.getByRole("heading", { name: "Choose your book character" })).toBeVisible();

  await expect.poll(() => page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key) || "null");
    return {
      resetEpoch: state?.resetEpoch,
      resetAdvanced: Number(state?.resetEpoch) > 0,
      pendingResetCount: state?.resetPendingIds?.length,
      hatched: state?.hatched,
      stopsDone: state?.trail?.stopsDone,
      checkpoint: state?.checkpoint
    };
  }, storageKey)).toEqual({
    resetEpoch: expect.any(Number),
    resetAdvanced: true,
    pendingResetCount: 1,
    hatched: false,
    stopsDone: [],
    checkpoint: null
  });

  // Recreate the hydrator's storage write + event with the old cloud row. The
  // mounted QuestRoot must neither resurrect it in memory nor save it on exit.
  await page.evaluate(async ({ key, stale }) => {
    const { computeHydratedValue } = await import("/src/utils/progressMerge.js");
    const current = JSON.parse(localStorage.getItem(key) || "null");
    localStorage.setItem(key, JSON.stringify(
      computeHydratedValue("phonics_quest", "__all__", current, stale)
    ));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: { studentId: "reset-reentry-regression", rows: [{ area: "phonics_quest", key: "__all__", payload: stale }] }
    }));
  }, { key: storageKey, stale: played });

  await expect.poll(() => page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key) || "null");
    return {
      resetEpoch: state?.resetEpoch,
      hatched: state?.hatched,
      stopsDone: state?.trail?.stopsDone,
      mastery: state?.mastery,
      purchases: state?.ledger?.purchases,
      checkpoint: state?.checkpoint,
      highContrast: state?.settings?.highContrast
    };
  }, storageKey)).toEqual({
    resetEpoch: expect.any(Number),
    hatched: false,
    stopsDone: [],
    mastery: {},
    purchases: [],
    checkpoint: null,
    highContrast: true
  });

  // Model a suspended old tab that missed the storage event and writes its
  // pre-reset state after the reset tab has already closed. The storage writer
  // itself must reject that downgrade; relying on another live tab to repair
  // localStorage leaves the exact exit/re-entry bug exposed.
  await page.evaluate(async ({ scopeKey, stale }) => {
    const { saveQuestProgress } = await import("/src/utils/questStore.js");
    saveQuestProgress(scopeKey, stale, { syncCloud: false });
  }, { scopeKey: scope, stale: played });
  await expect.poll(() => page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key) || "null");
    return {
      resetIdChanged: state?.resetId !== "legacy",
      hatched: state?.hatched,
      stopsDone: state?.trail?.stopsDone,
      checkpoint: state?.checkpoint
    };
  }, storageKey)).toEqual({
    resetIdChanged: true,
    hatched: false,
    stopsDone: [],
    checkpoint: null
  });

  await page.getByRole("button", { name: "Close Choose your book character" }).click();
  await expect(page.getByText("Closed. Your progress was saved.")).toBeVisible();
  await page.getByRole("button", { name: "Open Sound Seekers" }).click();
  await expect(page.getByRole("heading", { name: "Choose your book character" })).toBeVisible();

  await page.getByRole("button", { name: "Close Choose your book character" }).click();
  await expect(page.getByText("Closed. Your progress was saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Choose your book character" })).toBeVisible();
});

test("simultaneous tabs keep both offline cloud-queue revisions", async ({ page, context }) => {
  const sibling = await context.newPage();
  const url = `${PREVIEW}&view=den&display=2d&sync=1`;
  await Promise.all([page.goto(url), sibling.goto(url)]);

  // Warm the already-bundled module before taking the context offline, then
  // enqueue the same whole-state identity from two renderer processes at once.
  await Promise.all([
    page.evaluate(() => import("/src/utils/progressSync.js")),
    sibling.evaluate(() => import("/src/utils/progressSync.js"))
  ]);
  await context.setOffline(true);
  await Promise.all([
    page.evaluate(async () => {
      const { configureProgressSync, queueProgressSave } = await import("/src/utils/progressSync.js");
      configureProgressSync({ studentId: "preview", mode: "student", token: "preview-browser-token" });
      queueProgressSave("phonics_quest", "__all__", {
        trail: { stopsDone: ["s1"], routeCursor: 2 }
      }, { scopeKey: "preview" });
    }),
    sibling.evaluate(async () => {
      const { configureProgressSync, queueProgressSave } = await import("/src/utils/progressSync.js");
      configureProgressSync({ studentId: "preview", mode: "student", token: "preview-browser-token" });
      queueProgressSave("phonics_quest", "__all__", {
        trail: { stopsDone: ["s40"], routeCursor: 40 }
      }, { scopeKey: "preview" });
    })
  ]);

  const queuedStops = await page.evaluate(async () => {
    const { mergeProgressQueueRecords, readProgressQueueRecords } = await import("/src/utils/progressQueue.js");
    const records = readProgressQueueRecords(localStorage)
      .filter(record => record.entry.area === "phonics_quest" && record.entry.key === "__all__");
    return mergeProgressQueueRecords(records)?.payload?.trail?.stopsDone || [];
  });
  expect([...queuedStops].sort()).toEqual(["s1", "s40"]);

  await context.setOffline(false);
  await sibling.close();
});

test("an interrupted journey queues immediately, recovers on reconnect, and resumes its exact task", async ({ page, context }) => {
  const cloudWrites = [];
  await page.route("**/rest/v1/rpc/student_save_progress", async route => {
    cloudWrites.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  const url = `${PREVIEW}&view=world&stop=s1&done=0&display=2d&active=0&sync=1`;
  await page.goto(url);
  await expect(page.locator(".q2d-root")).toBeVisible();
  await expect(page.locator(".q2d-choices button").first()).toBeVisible();

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await page.locator(".q2d-choices button").first().click();

  const readOfflineEvidence = () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("lp-quest:preview") || "null");
    const queue = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || "";
      if (key.startsWith("lp-progress-sync-entry-v2:")) {
        queue.push(JSON.parse(localStorage.getItem(key)));
      }
    }
    queue.push(...JSON.parse(localStorage.getItem("lp-progress-sync-queue-v1") || "[]"));
    return {
      checkpoint: state?.checkpoint || null,
      interruptions: state?.telemetry?.current?.runtime?.networkInterruptions || 0,
      pending: Boolean(state?.telemetry?.current?.runtime?.syncPending),
      queued: queue.length,
      recoveryMarked: Boolean(queue[0]?.needsRecovery),
      revision: queue[0]?.revision || ""
    };
  });
  await expect.poll(readOfflineEvidence).toMatchObject({
    interruptions: 1,
    pending: true,
    queued: 1,
    recoveryMarked: true
  });
  const offlineEvidence = await readOfflineEvidence();
  const interruptedCheckpoint = offlineEvidence.checkpoint;
  expect(interruptedCheckpoint?.activeId).toBeTruthy();
  expect(offlineEvidence.revision).toBeTruthy();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => cloudWrites.length).toBeGreaterThan(0);
  expect(cloudWrites.every(write => (
    write?.p_payload?.telemetry === undefined
    && write?.p_payload?.assignment === undefined
  ))).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("lp-quest:preview") || "null");
    const queue = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || "";
      if (key.startsWith("lp-progress-sync-entry-v2:")) {
        queue.push(JSON.parse(localStorage.getItem(key)));
      }
    }
    queue.push(...JSON.parse(localStorage.getItem("lp-progress-sync-queue-v1") || "[]"));
    return {
      recoveries: state?.telemetry?.current?.runtime?.syncRecoveries || 0,
      pending: Boolean(state?.telemetry?.current?.runtime?.syncPending),
      queued: queue.length
    };
  }), { timeout: 8_000 }).toEqual({ recoveries: 1, pending: false, queued: 0 });

  await page.goto(`${url}&resume=1`);
  await expect(page.locator(".q2d-root")).toBeVisible();
  const resumedCheckpoint = await page.evaluate(() => JSON.parse(
    localStorage.getItem("lp-quest:preview") || "null"
  )?.checkpoint || null);
  expect(resumedCheckpoint).toEqual(interruptedCheckpoint);
});

test("Star Reach loads only its active chapter art and reports the cost", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PREVIEW}&view=world&stop=s36&done=35&display=pixel&active=0`);

  const world = page.locator(".qp-root[data-ready='true']");
  await expect(world).toBeVisible({ timeout: 10_000 });
  const stats = await world.evaluate(element => ({
    requests: Number(element.getAttribute("data-scene-asset-requests")),
    bytes: Number(element.getAttribute("data-scene-asset-bytes")),
    audioRequests: Number(element.getAttribute("data-scene-audio-asset-requests")),
    audioBytes: Number(element.getAttribute("data-scene-audio-asset-bytes")),
    totalRequests: Number(element.getAttribute("data-scene-total-asset-requests")),
    totalBytes: Number(element.getAttribute("data-scene-total-asset-bytes"))
  }));
  expect(stats.requests).toBeGreaterThan(0);
  expect(stats.requests).toBeLessThan(50);
  expect(stats.bytes).toBeGreaterThan(0);
  expect(stats.audioRequests).toBeGreaterThan(0);
  expect(stats.audioBytes).toBeGreaterThan(0);
  expect(stats.totalRequests).toBe(stats.requests + stats.audioRequests);
  expect(stats.totalBytes).toBe(stats.bytes + stats.audioBytes);

  const premiumChapterRequests = await page.evaluate(() => performance.getEntriesByType("resource")
    .map(entry => entry.name)
    .filter(name => name.includes("/game-assets/quest-pixel/") && name.includes("-premium/")));
  expect(premiumChapterRequests.some(name => name.includes("/star-reach/"))).toBe(true);
  expect(premiumChapterRequests.every(name => name.includes("/star-reach/"))).toBe(true);
});

test("the customised Beastie has a distinct authored pose for every quest action", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 520 });
  await page.goto("/preview/quest.html?view=beastie-atlas");
  await expect(page.getByRole("heading", { name: "Custom Beastie action atlas" })).toBeVisible();
  await expect(page.locator("#beastie-action-atlas")).toBeVisible();

  const report = await page.evaluate(() => {
    const sheet = document.getElementById("beastie-action-atlas");
    const directions = JSON.parse(sheet.dataset.directions);
    const poses = JSON.parse(sheet.dataset.actions);
    const context = sheet.getContext("2d");
    const frameSize = Number(sheet.dataset.frameSize);
    const framePixels = (row, frame) => context.getImageData(
      frame * frameSize,
      row * frameSize,
      frameSize,
      frameSize
    ).data;
    const occupied = pixels => {
      let count = 0;
      for (let offset = 3; offset < pixels.length; offset += 4) {
        if (pixels[offset] > 0) count += 1;
      }
      return count;
    };
    const difference = (first, second) => {
      let count = 0;
      for (let offset = 0; offset < first.length; offset += 4) {
        if (
          first[offset] !== second[offset]
          || first[offset + 1] !== second[offset + 1]
          || first[offset + 2] !== second[offset + 2]
          || first[offset + 3] !== second[offset + 3]
        ) count += 1;
      }
      return count;
    };

    const actions = [];
    for (let row = 0; row < directions.length; row += 1) {
      const idle = framePixels(row, 0);
      for (let action = 0; action < poses.length; action += 1) {
        const pixels = framePixels(row, action + 4);
        actions.push({
          direction: directions[row],
          pose: poses[action],
          occupied: occupied(pixels),
          differenceFromIdle: difference(idle, pixels)
        });
      }
    }
    return {
      width: sheet.width,
      height: sheet.height,
      actions
    };
  });

  expect(report.width).toBe(1024);
  expect(report.height).toBe(256);
  expect(report.actions).toHaveLength(48);
  expect(report.actions.every(action => action.occupied > 220)).toBe(true);
  expect(report.actions.every(action => action.differenceFromIdle > 80)).toBe(true);
  await page.locator("#beastie-action-atlas").screenshot({
    path: ".artifacts/quest-release/beastie-action-atlas.png"
  });
});

test("the mobile release surface keeps the Den and settings child-reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}&view=den&done=20`);

  await expect(page.getByRole("heading", { name: "Your Den" })).toBeVisible();
  await expectVisibleButtonsReachable(page);
  await page.getByRole("button", { name: "Settings" }).click();
  const settings = page.getByRole("dialog", { name: "Display, sound and access" });
  await expect(settings).toBeVisible();
  await expect(settings.getByLabel("Picture style")).toHaveCount(0);
  await expect(settings.getByLabel("Reduce motion")).toBeVisible();
  await expect(settings.getByLabel("High contrast")).toBeVisible();
  await expect(settings.getByLabel("Quiet soundscape (spoken sounds stay on)")).toBeVisible();
  await expect(settings.getByLabel("Sound on")).toBeVisible();
  await expectVisibleButtonsReachable(page);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
  await page.screenshot({ path: ".artifacts/quest-release/mobile-den-settings.png" });
});

test("the mobile release surface keeps creature creation child-reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}&view=creator&done=20`);

  await expect(page.getByRole("heading", { name: "Change your book character" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Character" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
  await expectVisibleButtonsReachable(page);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
  await page.screenshot({ path: ".artifacts/quest-release/mobile-creature-creator.png" });
});

test("the mobile release surface keeps the chapter map child-reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}&view=map&stop=s16&done=20`);

  await expect(page.getByRole("heading", { name: "Forge Settlement" })).toBeVisible();
  await expect(page.getByLabel("Choose a story chapter")).toBeVisible();
  await expect(page.locator(".q-map-stop-landmark")).toHaveCount(5);
  await expectVisibleButtonsReachable(page);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
  await page.screenshot({ path: ".artifacts/quest-release/mobile-trail-map.png" });
});

test("the mobile release surface keeps the Trading Post child-reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}&view=post&done=20`);

  await expect(page.getByRole("heading", { name: "Trading Post" })).toBeVisible();
  await expect(page.getByRole("tabpanel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to map" })).toBeVisible();
  await expectVisibleButtonsReachable(page);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
  await page.screenshot({ path: ".artifacts/quest-release/mobile-trading-post.png" });
});

test("the mobile release surface keeps the chapter ceremony child-reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}&view=ceremony&stop=s5&done=5&display=2d&motion=reduce`);

  const reward = page.getByRole("dialog", { name: "Bramble Gate reward" });
  await expect(reward).toBeVisible({ timeout: 10_000 });
  await expect(reward.getByRole("button", { name: "Continue the trail" })).toBeVisible();
  await expectVisibleButtonsReachable(page);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
  await page.screenshot({ path: ".artifacts/quest-release/mobile-chapter-ceremony.png" });
});
