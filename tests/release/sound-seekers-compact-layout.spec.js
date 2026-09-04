import { expect, test } from "@playwright/test";

const PREVIEW = "/preview/quest-preview.html";
const FIXTURE = "s1-primary-echo-search";

function fixtureUrl(scope) {
  const params = new URLSearchParams({
    fixture: FIXTURE,
    reset: "1",
    scope,
    sound: "1"
  });
  return `${PREVIEW}?${params}`;
}

async function expectVisiblePreschoolTargets(page, locator) {
  const targets = await locator.evaluateAll(nodes => nodes.map(node => {
    const bounds = node.getBoundingClientRect();
    return {
      label: node.getAttribute("aria-label") || node.textContent?.trim() || "control",
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
      width: bounds.width,
      height: bounds.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }));
  expect(targets.length).toBeGreaterThan(0);
  for (const target of targets) {
    expect(target.width, `${target.label} width`).toBeGreaterThanOrEqual(56);
    expect(target.height, `${target.label} height`).toBeGreaterThanOrEqual(56);
    expect(target.left, `${target.label} left edge`).toBeGreaterThanOrEqual(0);
    expect(target.top, `${target.label} top edge`).toBeGreaterThanOrEqual(0);
    expect(target.right, `${target.label} right edge`).toBeLessThanOrEqual(target.viewportWidth + 0.5);
    expect(target.bottom, `${target.label} bottom edge`).toBeLessThanOrEqual(target.viewportHeight + 0.5);
  }
}

for (const viewport of [
  { width: 568, height: 320 },
  { width: 720, height: 450 }
]) {
  test(`compact expedition keeps movement and learning controls in frame at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(fixtureUrl(`compact-layout-${viewport.width}x${viewport.height}`));

    const game = page.locator('[data-sound-seekers-game="v2"]');
    await expect(game).toHaveAttribute("data-view", "expedition");
    const movement = page.locator("[data-ss-fallback-controls] button");
    const learning = page.locator("[data-ss-action-layer] button");
    await expect(movement).toHaveCount(4);
    await expect(learning).toHaveCount(1);

    await expectVisiblePreschoolTargets(page, movement);
    await expectVisiblePreschoolTargets(page, learning);

    expect(await page.evaluate(() => ({
      documentOverflow: document.documentElement.scrollWidth
        - document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
      gameOverflow: document.querySelector("[data-sound-seekers-game]").scrollWidth
        - document.querySelector("[data-sound-seekers-game]").clientWidth
    }))).toEqual({ documentOverflow: 0, bodyOverflow: 0, gameOverflow: 0 });
  });
}

test("phone modal paints above expedition toolbar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(fixtureUrl("compact-layout-modal"));
  await expect(page.locator('[data-sound-seekers-game="v2"]')).toHaveAttribute("data-view", "expedition");

  await page.getByRole("button", { name: "Game settings" }).click();
  await expect(page.getByRole("dialog", { name: "Game settings" })).toBeVisible();

  const stacking = await page.evaluate(() => {
    const modal = document.querySelector(".ss-modal-layer");
    const toolbar = document.querySelector(".ss-expedition__route-tools");
    const toolbarBounds = toolbar.getBoundingClientRect();
    const point = document.elementFromPoint(
      toolbarBounds.left + toolbarBounds.width / 2,
      toolbarBounds.top + toolbarBounds.height / 2
    );
    return {
      modalZ: Number.parseInt(getComputedStyle(modal).zIndex, 10),
      toolbarZ: Number.parseInt(getComputedStyle(toolbar).zIndex, 10),
      pointOwnedByModal: Boolean(point?.closest(".ss-modal-layer")),
      horizontalOverflow: document.documentElement.scrollWidth
        - document.documentElement.clientWidth
    };
  });
  expect(stacking.modalZ).toBeGreaterThan(stacking.toolbarZ);
  expect(stacking.pointOwnedByModal).toBe(true);
  expect(stacking.horizontalOverflow).toBe(0);
});
