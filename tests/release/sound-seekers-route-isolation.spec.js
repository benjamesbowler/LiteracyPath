import { expect, test } from "@playwright/test";
import { freshChapter, currentAct } from "../../demos/sound-seekers/src/chapter/progress.js";
import { createCampaignPreviewProgress } from "../../src/features/soundSeekers/preview/campaignPreview.js";
import { woodlandChapterStorageKey } from "../../src/utils/progressKeys.js";
import { campaignStorageKey } from "../../src/features/soundSeekers/v3/campaignStorage.js";
import { getCampaignStage } from "../../src/features/soundSeekers/v3/content/campaign.js";

const HARNESS = "/tests/fixtures/soundSeekersRouteIsolationHarness.html";
const PORTAL = "[data-sound-seekers-route-portal]";

async function openRoute(page) {
  // These interaction assertions render real Blender assets under software GL.
  test.slow();
  await page.goto(HARNESS);
  await expect(page.locator("html")).toHaveAttribute("data-route-harness-ready", "true");
  const opener = page.getByRole("button", { name: "Open Sound Seekers" });
  await opener.focus();
  await opener.click();
  await expect(page.locator(PORTAL)).toHaveCount(1);
  await expect(page.getByRole("main", { name: "Sound Seekers", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "Start exploring", exact: true })).toBeEnabled();
  return opener;
}

test("real route owns one isolated fullscreen host and restores exact page state on exit", async ({ page }) => {
  const opener = await openRoute(page);

  expect(await page.evaluate(portalSelector => {
    const portal = document.querySelector(portalSelector);
    const allSiblings = [...document.body.children].filter(element => element !== portal);
    return {
      bodyOverflow: document.body.style.overflow,
      bodyOverflowPriority: document.body.style.getPropertyPriority("overflow"),
      allBodySiblingsIsolated: allSiblings.every(element => (
        element.getAttribute("aria-hidden") === "true" && element.inert === true
      )),
      siblings: allSiblings
        .filter(element => element.tagName !== "SCRIPT")
        .map(element => ({
          id: element.id,
          ariaHidden: element.getAttribute("aria-hidden"),
          inertAttribute: element.getAttribute("inert"),
          inertProperty: element.inert
        })),
      roleApplicationCount: portal.querySelectorAll("[role='application']").length,
      keydownListeners: window.__soundSeekersDocumentListenerCount("keydown")
    };
  }, PORTAL)).toEqual({
    bodyOverflow: "hidden",
    bodyOverflowPriority: "important",
    allBodySiblingsIsolated: true,
    siblings: [
      { id: "route-opener", ariaHidden: "true", inertAttribute: "", inertProperty: true },
      { id: "prior-isolated-sibling", ariaHidden: "true", inertAttribute: "", inertProperty: true },
      { id: "root", ariaHidden: "true", inertAttribute: "", inertProperty: true }
    ],
    roleApplicationCount: 0,
    keydownListeners: 1
  });

  const originalPortal = await page.locator(PORTAL).evaluate(element => {
    window.__initialSoundSeekersPortal = element;
    return element.dataset.soundSeekersRoutePortal;
  });
  await page.evaluate(() => window.__setSoundSeekersRouteScope("route-isolation-b"));
  await expect(page.locator(PORTAL)).toHaveCount(1);
  expect(await page.locator(PORTAL).evaluate(element => ({
    sameHost: element === window.__initialSoundSeekersPortal,
    keydownListeners: window.__soundSeekersDocumentListenerCount("keydown")
  }))).toEqual({ sameHost: true, keydownListeners: 1 });
  expect(originalPortal).toBe("");

  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.locator(PORTAL)).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => ({
    bodyOverflow: document.body.style.overflow,
    bodyOverflowPriority: document.body.style.getPropertyPriority("overflow"),
    openerAriaHidden: document.getElementById("route-opener").getAttribute("aria-hidden"),
    openerInert: document.getElementById("route-opener").hasAttribute("inert"),
    priorAriaHidden: document.getElementById("prior-isolated-sibling").getAttribute("aria-hidden"),
    priorInert: document.getElementById("prior-isolated-sibling").getAttribute("inert"),
    rootAriaHidden: document.getElementById("root").getAttribute("aria-hidden"),
    rootInert: document.getElementById("root").hasAttribute("inert"),
    scriptAriaHidden: document.querySelector("body > script").getAttribute("aria-hidden"),
    scriptInert: document.querySelector("body > script").hasAttribute("inert"),
    keydownListeners: window.__soundSeekersDocumentListenerCount("keydown")
  }))).toEqual({
    bodyOverflow: "scroll",
    bodyOverflowPriority: "important",
    openerAriaHidden: null,
    openerInert: false,
    priorAriaHidden: "false",
    priorInert: "",
    rootAriaHidden: "false",
    rootInert: false,
    scriptAriaHidden: null,
    scriptInert: false,
    keydownListeners: 0
  });
});

test("the latest valid adventure leads with its repair, both checkpoints survive and pupils stay isolated", async ({ page }) => {
  test.slow();
  const scope = "route-isolation-a";
  const campaign = { ...createCampaignPreviewProgress("meadow-01"), updatedAt: Date.UTC(2026, 10, 21) };
  const woodland = { ...freshChapter(19), attempts: 1, mode: "activity", updatedAt: "2026-11-23T00:00:00.000Z" };
  const rows = [
    [campaignStorageKey(scope), JSON.stringify(campaign)],
    [woodlandChapterStorageKey(scope), JSON.stringify(woodland)]
  ];
  await page.addInitScript(rows => rows.forEach(([key, value]) => localStorage.setItem(key, value)), rows);
  await page.goto(HARNESS, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-route-harness-ready", "true");
  await page.getByRole("button", { name: "Open Sound Seekers" }).click();
  const primary = page.locator(`${PORTAL} [data-mode="title"] [data-child-primary]`);
  await expect(primary).toHaveText("Continue Woodland Homecoming");
  await expect(page.getByText(currentAct(woodland).title, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Back to ${getCampaignStage("meadow-01").name}`, exact: true })).toBeVisible();
  await primary.click();
  await expect(page.locator('[data-sound-seekers-game="woodland"]')).toHaveAttribute("data-phase", "title");
  await page.getByRole("button", { name: "Three-world adventure", exact: true }).click();
  await expect(primary).toHaveText("Continue Woodland Homecoming");
  expect(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), rows.map(([key]) => key))).toEqual(rows.map(([, value]) => value));

  await page.evaluate(() => window.__setSoundSeekersRouteScope("route-isolation-b"));
  await expect(primary).toHaveText("Start exploring");
  await expect(page.getByRole("button", { name: "Woodland Homecoming", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /retired|classic adventure/i })).toHaveCount(0);
});

test("guest return choices ignore device checkpoints and keep changes within that visit", async ({ page }) => {
  test.slow();
  const key = woodlandChapterStorageKey("route-isolation-a");
  const original = JSON.stringify({ ...freshChapter(20), attempts: 4, updatedAt: "2026-11-23T00:00:00.000Z" });
  await page.addInitScript(({ key, original }) => localStorage.setItem(key, original), { key, original });
  await page.goto(`${HARNESS}?guest`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-route-harness-ready", "true");
  await page.getByRole("button", { name: "Open Sound Seekers" }).click();
  await expect(page.locator(`${PORTAL} [data-mode="title"] [data-child-primary]`)).toHaveText("Start exploring");
  await page.getByRole("button", { name: "Woodland Homecoming", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start a new adventure", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Turn sound on", exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(original);
  await page.getByRole("button", { name: "Three-world adventure", exact: true }).click();
  await expect(page.getByRole("button", { name: "Woodland Homecoming", exact: true })).toBeVisible();
});

test("route traps forward and reverse Tab while nested sheets retain their own focus boundary", async ({ page }) => {
  await openRoute(page);

  const tabOrder = page.locator(`${PORTAL} button:not([disabled]), ${PORTAL} input:not([disabled]), ${PORTAL} select:not([disabled]), ${PORTAL} textarea:not([disabled]), ${PORTAL} a[href], ${PORTAL} [contenteditable='true'], ${PORTAL} [tabindex]:not([tabindex='-1'])`)
    .filter({ visible: true });
  const count = await tabOrder.count();
  expect(count).toBeGreaterThan(2);
  const first = tabOrder.first();
  const last = tabOrder.last();
  const routeSurface = page.getByRole("main", { name: "Sound Seekers", exact: true });

  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await routeSurface.focus();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();

  await last.focus();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();

  await page.getByRole("button", { name: "Start exploring", exact: true }).click();
  const settingsOpener = page.getByRole("button", { name: "Pause", exact: true });
  await settingsOpener.focus();
  await settingsOpener.click();
  const dialog = page.getByRole("dialog", { name: "Paused", exact: true });
  const resume = page.getByRole("button", { name: "Resume", exact: true });
  const close = page.getByRole("button", { name: "Close Paused", exact: true });
  const save = page.getByRole("button", { name: "Leave for Home", exact: true });
  await expect(dialog).toBeVisible();
  await expect(resume).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(save).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(settingsOpener).toBeFocused();

  const targetSizes = await page.locator(`${PORTAL} button:not([disabled])`).evaluateAll(elements => elements
    .filter(element => element.getClientRects().length > 0)
    .map(element => {
      const box = element.getBoundingClientRect();
      return { label: element.textContent.trim() || element.getAttribute("aria-label"), width: box.width, height: box.height };
    }));
  for (const target of targetSizes) {
    expect(target.width, target.label).toBeGreaterThanOrEqual(56);
    expect(target.height, target.label).toBeGreaterThanOrEqual(56);
  }

  await page.evaluate(() => window.__unmountSoundSeekersRoute());
  await expect(page.locator(PORTAL)).toHaveCount(0);
  expect(await page.evaluate(() => window.__soundSeekersDocumentListenerCount("keydown"))).toBe(0);
});
