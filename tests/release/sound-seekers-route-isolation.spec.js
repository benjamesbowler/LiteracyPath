import { expect, test } from "@playwright/test";

const HARNESS = "/tests/fixtures/soundSeekersRouteIsolationHarness.html";
const PORTAL = "[data-sound-seekers-route-portal]";

async function openRoute(page) {
  await page.goto(HARNESS);
  await expect(page.locator("html")).toHaveAttribute("data-route-harness-ready", "true");
  const opener = page.getByRole("button", { name: "Open Sound Seekers" });
  await opener.focus();
  await opener.click();
  await expect(page.locator(PORTAL)).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Sound Seekers reading adventure" })).toBeFocused();
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

  await page.getByRole("button", { name: "Leave trail" }).click();
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

test("route traps forward and reverse Tab while nested sheets retain their own focus boundary", async ({ page }) => {
  await openRoute(page);

  const tabOrder = page.locator(`${PORTAL} button:not([disabled]), ${PORTAL} input:not([disabled]), ${PORTAL} select:not([disabled]), ${PORTAL} textarea:not([disabled]), ${PORTAL} a[href], ${PORTAL} [contenteditable='true'], ${PORTAL} [tabindex]:not([tabindex='-1'])`)
    .filter({ visible: true });
  const count = await tabOrder.count();
  expect(count).toBeGreaterThan(2);
  const first = tabOrder.first();
  const last = tabOrder.last();
  const routeSurface = page.getByRole("region", { name: "Sound Seekers reading adventure" });

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

  const settingsOpener = page.getByRole("button", { name: "Game settings" });
  await settingsOpener.focus();
  await settingsOpener.click();
  const dialog = page.getByRole("dialog", { name: "Game settings" });
  const close = page.getByRole("button", { name: "Close game settings" });
  const save = page.getByRole("button", { name: "Save and return" });
  await expect(dialog).toBeVisible();
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
