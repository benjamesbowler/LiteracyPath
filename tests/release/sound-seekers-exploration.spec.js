import { expect, test } from "@playwright/test";
import { campaignStorageKey } from "../../src/features/soundSeekers/v3/campaignStorage.js";

const GAME = '[data-sound-seekers-game="rounded-campaign"]';
const CANVAS = ".rc-landscape canvas";

test.use({ viewport: { width: 1000, height: 670 } });

function previewUrl(scope, resume = false) {
  return `/preview/rounded-campaign.html?stage=meadow-01&scope=${scope}&simple=1${resume ? "&resume=1" : ""}`;
}

async function explore(page, scope, resume = false) {
  await page.goto(previewUrl(scope, resume));
  const game = page.locator(GAME);
  await game.getByRole("button", { name: "Start exploring", exact: true }).click();
  await expect(game).toHaveAttribute("data-mode", "explore");
  await expect(game).toHaveAttribute("data-scene-ready", "true", { timeout: 30_000 });
  await expect(page.locator(CANVAS)).toHaveAttribute("data-phase", "explore");
  return game;
}

async function snapshot(page, scope) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), campaignStorageKey(`sound-seekers-preview:rounded:${scope}`));
}

async function watchLift(canvas) {
  await canvas.evaluate(element => {
    element.dataset.testPeakLift = "0";
    const observer = new MutationObserver(() => {
      const lift = Number(element.dataset.playerLift);
      element.dataset.testPeakLift = String(Math.max(lift, Number(element.dataset.testPeakLift)));
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-player-lift"] });
  });
}

test("Bouncy jumps with Space in the world and Pause returns the game to a grounded idle state", async ({ page }, info) => {
  test.setTimeout(120_000);
  const scope = `jump-${info.project.name}`;
  const game = await explore(page, scope);
  const canvas = page.locator(CANVAS);
  const before = await snapshot(page, scope);
  await watchLift(canvas);
  await canvas.focus();
  await page.keyboard.press("Space");
  await expect.poll(async () => Number(await canvas.getAttribute("data-test-peak-lift"))).toBeGreaterThan(0.2);
  await expect(canvas).toHaveAttribute("data-player-lift", "0.000");

  await page.keyboard.press("Space");
  await page.keyboard.press("Escape");
  const paused = game.getByRole("dialog", { name: "Paused", exact: true });
  await expect(paused).toBeVisible();
  await expect(canvas).toHaveAttribute("data-paused", "true");
  await expect(canvas).toHaveAttribute("data-player-lift", "0.000");
  const frame = await canvas.getAttribute("data-rendered-frames");
  await page.waitForTimeout(250);
  await expect(canvas).toHaveAttribute("data-rendered-frames", frame);
  await paused.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-paused", "false");
  await expect(canvas).toHaveAttribute("data-player-lift", "0.000");

  const after = await snapshot(page, scope);
  expect(after.evidence).toEqual(before.evidence);
  expect(after.campaign.completedMissions).toEqual(before.campaign.completedMissions);
  expect(after.campaign.activeMissionId).toBeNull();
});

test("tablet touch can reach Jump without covering movement and the hop settles with gentle movement on", async ({ browser }, info) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({
    baseURL: info.project.use.baseURL,
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"
  });
  try {
    const page = await context.newPage();
    const game = await explore(page, `touch-jump-${info.project.name}`);
    const canvas = page.locator(CANVAS);
    const jump = game.getByRole("button", { name: "Jump", exact: true });
    const bounds = await jump.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(56);
    expect(bounds.height).toBeGreaterThanOrEqual(56);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(1024);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(768);
    const directions = await game.locator(".rc-movement button").evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }));
    expect(directions).toHaveLength(4);
    for (const direction of directions) {
      const sharedWidth = Math.min(direction.right, bounds.x + bounds.width) - Math.max(direction.left, bounds.x);
      const sharedHeight = Math.min(direction.bottom, bounds.y + bounds.height) - Math.max(direction.top, bounds.y);
      expect(sharedWidth <= 0 || sharedHeight <= 0).toBe(true);
    }
    await watchLift(canvas);
    await jump.tap();
    await expect.poll(async () => Number(await canvas.getAttribute("data-test-peak-lift"))).toBeGreaterThan(0.2);
    await expect(canvas).toHaveAttribute("data-player-lift", "0.000");
    await page.screenshot({ path: info.outputPath("tablet-exploration.png") });
  } finally {
    await context.close();
  }
});

test("guided trail walks to each real marker and saves a narrative discovery without a literacy response", async ({ page }, info) => {
  test.setTimeout(240_000);
  const scope = `guided-trail-${info.project.name}`;
  const game = await explore(page, scope);
  const canvas = page.locator(CANVAS);
  const before = await snapshot(page, scope);
  const total = Number(await canvas.getAttribute("data-trail-total"));
  expect(total).toBeGreaterThan(1);
  await expect(canvas).toHaveAttribute("data-trail-index", "0");

  for (let marker = 1; marker <= total; marker++) {
    const position = await canvas.evaluate(element => [element.dataset.playerX, element.dataset.playerZ]);
    if (marker === 1) {
      await game.getByRole("button", { name: "Places", exact: true }).click();
      const places = game.getByRole("dialog", { name: "Places", exact: true });
      await places.getByText("Trail markers", { exact: true }).click();
      await places.getByRole("button", { name: "Find the next trail marker", exact: true }).click();
      await expect(places).toHaveCount(0);
    } else {
      await game.getByRole("button", { name: "Find the next trail marker", exact: true }).click();
    }
    await expect(canvas).toHaveAttribute("data-trail-index", String(marker), { timeout: 75_000 });
    expect(await canvas.evaluate(element => [element.dataset.playerX, element.dataset.playerZ])).not.toEqual(position);
    await expect(game).toHaveAttribute("data-mode", "explore");
  }

  await expect.poll(async () => (await snapshot(page, scope)).campaign.gameDiscoveries["meadow-01:trail"]).toMatchObject({
    stageId: "meadow-01", id: "trail", kind: "trail", narrativeOnly: true
  });
  const after = await snapshot(page, scope);
  expect(after.evidence).toEqual(before.evidence);
  expect(after.campaign.activeMissionId).toBeNull();
  expect(after.campaign.completedMissions).toEqual(before.campaign.completedMissions);
  await page.screenshot({ path: info.outputPath("earned-trail-completion.png") });

  await explore(page, scope, true);
  await expect(canvas).toHaveAttribute("data-trail-index", String(total));
  expect((await snapshot(page, scope)).campaign.gameDiscoveries).toEqual(after.campaign.gameDiscoveries);
});
