import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";

const MIN_TEXT_CONTRAST = 4.5;
const MIN_FOCUS_WIDTH_PX = 3;

function parseRgb(value) {
  const channels = String(value).match(/[\d.]+/g)?.map(Number) || [];
  return channels.slice(0, 3);
}

function relativeLuminance(rgb) {
  const channels = rgb.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(parseRgb(foreground));
  const second = relativeLuminance(parseRgb(background));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function expectNoColourContrastViolations(page, selector, state) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withRules(["color-contrast"])
    .analyze();
  const failures = result.violations.flatMap(violation =>
    violation.nodes.map(node => ({
      id: violation.id,
      target: node.target.join(" "),
      summary: node.failureSummary
    }))
  );
  expect(failures, `${state} has automated colour-contrast failures`).toEqual([]);
}

async function expectSolidTextContrast(locator, state) {
  const colours = await locator.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      foreground: style.color,
      background: style.backgroundColor
    };
  });
  expect(
    contrastRatio(colours.foreground, colours.background),
    `${state} must retain at least ${MIN_TEXT_CONTRAST}:1 contrast`
  ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
}

async function expectKeyboardFocusVisible(page, locator, state) {
  await page.keyboard.press("Tab");
  await locator.focus();
  const focus = await locator.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth) || 0
    };
  });
  expect(focus.focusVisible, `${state} must match :focus-visible`).toBe(true);
  expect(focus.outlineStyle, `${state} must use a non-hidden outline`).not.toBe("none");
  expect(focus.outlineWidth, `${state} focus indicator must be at least ${MIN_FOCUS_WIDTH_PX}px`)
    .toBeGreaterThanOrEqual(MIN_FOCUS_WIDTH_PX);
}

async function expectAllVisibleControlsHaveFocus(page, root, state) {
  const controls = root.locator(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const count = await controls.count();
  let checked = 0;
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (!await control.isVisible()) continue;
    checked += 1;
    await expectKeyboardFocusVisible(page, control, `${state} control ${checked}`);
  }
  expect(checked, `${state} must expose at least one visible enabled control`).toBeGreaterThan(0);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: async () => {}
    });
  });
});

test("A3.5 every registered game overlay passes contrast and visible-focus checks", async ({
  page
}) => {
  test.setTimeout(90_000);
  for (const game of GAME_LIST) {
    await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}`);
    const dialog = page.getByRole("dialog", { name: game.title, exact: true });
    await expect(dialog).toBeVisible();
    await expectNoColourContrastViolations(page, ".lg-game-player", game.title);
    await expectSolidTextContrast(
      dialog.locator(".lg-game-title-chip span"),
      `${game.title} difficulty badge`
    );

    await expectAllVisibleControlsHaveFocus(page, dialog, game.title);
    const close = dialog.getByRole("button", { name: `Close ${game.title}`, exact: true });
    await close.click();

    const quit = page.getByRole("alertdialog", { name: `Quit ${game.title}`, exact: true });
    await expect(quit).toBeVisible();
    await expectNoColourContrastViolations(page, ".lg-game-confirm", `${game.title} quit prompt`);
    await expectAllVisibleControlsHaveFocus(page, quit, `${game.title} quit prompt`);
  }
});

test("A3.5 every registered game overlay retains focus in forced-colours mode", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ forcedColors: "active" });
  for (const game of GAME_LIST) {
    await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}`);
    const dialog = page.getByRole("dialog", { name: game.title, exact: true });
    await expect(dialog).toBeVisible();
    await expectAllVisibleControlsHaveFocus(page, dialog, `${game.title} forced-colours overlay`);
  }
});

test("A3.5 Sound Racer dark tutorial keeps readable text and visible focus", async ({
  page
}) => {
  await page.goto("/preview/game-overlay.html?game=sound-racer");
  const overlay = page.locator('[data-sr="overlay"]');
  await expect(overlay).toBeVisible({ timeout: 15_000 });
  await expectNoColourContrastViolations(page, '[data-sr="overlay"]', "Sound Racer tutorial");
  await expectKeyboardFocusVisible(
    page,
    overlay.locator('[data-sr="intro-hear"]'),
    "Sound Racer Hear the example control"
  );
  await expectKeyboardFocusVisible(
    page,
    overlay.locator('[data-sr="intro-play"]'),
    "Sound Racer play control"
  );
});

test("A3.5 locked creature options stay legible in standard and high-contrast modes", async ({
  page
}) => {
  for (const contrast of ["standard", "high"]) {
    const query = contrast === "high" ? "&contrast=high" : "";
    await page.goto(`/preview/quest.html?view=creator&sound=0&adapt=0${query}`);
    const dialog = page.getByRole("dialog", { name: "Change your creature", exact: true });
    await expect(dialog).toBeVisible();
    const locked = dialog.locator(".q-option.is-locked");
    await expect(locked.first()).toBeVisible();
    await expectNoColourContrastViolations(page, ".q-root", `${contrast} creature creator`);
    await expect(locked.first()).toHaveCSS("opacity", "1");
    await expectKeyboardFocusVisible(
      page,
      dialog.locator(".q-option:not(.is-locked)").first(),
      `${contrast} creature option`
    );
    if (contrast === "high") {
      await expect(dialog).toHaveAttribute("data-high-contrast", "true");
      await expect(locked.first()).toHaveCSS("background-color", "rgb(5, 5, 5)");
    }
  }
});
