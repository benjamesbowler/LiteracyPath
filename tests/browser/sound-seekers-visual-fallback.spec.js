import { expect, test } from "@playwright/test";

const BACKGROUND_PATTERN = "**/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp";
const HARNESS_PATH = "/tests/fixtures/soundSeekersVisualHarness.html?scene=scene-s1";
const HARNESS_ID = "task4-v2-fallback";
const HARNESS_URL = process.env.SOUND_SEEKERS_VISUAL_BASE_URL
  ? new URL(HARNESS_PATH, process.env.SOUND_SEEKERS_VISUAL_BASE_URL).href
  : HARNESS_PATH;

async function optionSnapshot(page) {
  return page.locator(".sound-seekers-scene__option").evaluateAll(buttons => buttons.map(button => ({
    label: button.textContent.trim(),
    accessibleLabel: button.getAttribute("aria-label"),
    semanticId: button.dataset.optionVisualId,
    token: button.dataset.optionToken
  })));
}

test("an aborted decorative biome image keeps the complete interactive scene", async ({ page }) => {
  let releaseAbort;
  const abortGate = new Promise(resolve => { releaseAbort = resolve; });
  let requestIntercepted = false;
  const failedRequests = [];
  page.on("requestfailed", request => failedRequests.push(request.url()));
  await page.route(BACKGROUND_PATTERN, async route => {
    requestIntercepted = true;
    await abortGate;
    await route.abort("failed");
  });

  const response = await page.goto(HARNESS_URL, { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);
  await expect(page.locator(
    `[data-sound-seekers-visual-harness='${HARNESS_ID}']`
  )).toBeAttached({ timeout: 5_000 });
  await expect.poll(
    () => requestIntercepted,
    { timeout: 5_000, message: "the exact Sound Seekers fallback harness must request its biome" }
  ).toBe(true);
  await expect(page.locator("[data-background-status='pending']")).toBeVisible();
  const beforeFailure = await optionSnapshot(page);
  expect(beforeFailure).toHaveLength(3);

  releaseAbort();
  await expect(page.locator("[data-background-status='failed']")).toBeVisible();
  await expect(page.locator("[data-code-native-setting]")).toBeVisible();
  await expect(page.locator("[data-route-geometry='route-geometry:s1']")).toBeVisible();
  await expect(page.locator("[data-landmark-state]")).toBeVisible();
  await expect(page.locator("[data-character-id='Moss']")).toBeVisible();
  await expect(page.getByRole("button")).toHaveCount(3);
  await expect(page.locator("[data-scene-prompt]")).toBeVisible();
  await expect(page.locator("[data-scene-loading]")).toHaveCount(0);
  await expect(page.locator("img[data-biome-background]")).toHaveAttribute("aria-hidden", "true");
  expect(await optionSnapshot(page)).toEqual(beforeFailure);
  expect(failedRequests.filter(url => url.includes("seedwake-meadow/background.webp"))).toHaveLength(1);

  const buttons = page.locator(".sound-seekers-scene__option");
  const boxes = await buttons.evaluateAll(elements => elements.map(element => {
    const rectangle = element.getBoundingClientRect();
    return { x: rectangle.x, y: rectangle.y, width: rectangle.width, height: rectangle.height };
  }));
  const viewportHeight = await page.evaluate(() => innerHeight);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
    expect(box.y + box.height).toBeLessThanOrEqual(viewportHeight);
  }
  for (let index = 1; index < boxes.length; index += 1) {
    const previous = boxes[index - 1];
    const current = boxes[index];
    const horizontalGap = current.x - (previous.x + previous.width);
    const verticalGap = current.y - (previous.y + previous.height);
    expect(Math.max(horizontalGap, verticalGap)).toBeGreaterThanOrEqual(8);
  }

  const activatedTokens = [];
  await page.keyboard.press("Tab");
  for (let index = 0; index < beforeFailure.length; index += 1) {
    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("data-option-visual-id", beforeFailure[index].semanticId);
    const focusStyle = await focused.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        color: style.outlineColor,
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth)
      };
    });
    expect(focusStyle.color).toBe("rgb(23, 33, 61)");
    expect(focusStyle.style).not.toBe("none");
    expect(focusStyle.width).toBeGreaterThan(0);
    await page.keyboard.press(index % 2 === 0 ? "Enter" : "Space");
    activatedTokens.push(beforeFailure[index].token);
    await expect(page.locator("[data-last-choice-token]")).toHaveText(beforeFailure[index].token);
    if (index < beforeFailure.length - 1) await page.keyboard.press("Tab");
  }
  expect(await page.evaluate(() => window.__soundSeekersChoiceTokens)).toEqual(activatedTokens);
});
