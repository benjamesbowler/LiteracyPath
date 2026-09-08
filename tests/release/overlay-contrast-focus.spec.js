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
  // Enter keyboard modality once, then inspect every control in one browser
  // round trip. The old per-control Playwright loop spent minutes crossing the
  // process boundary and timed out before it reached the later games.
  await page.keyboard.press("Tab");
  const focusResults = await root.evaluate(element => {
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return [...element.querySelectorAll(selector)]
      .filter(control => {
        const style = getComputedStyle(control);
        const rect = control.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity) > 0
          && rect.width > 0
          && rect.height > 0;
      })
      .map((control, index) => {
        control.focus();
        const style = getComputedStyle(control);
        return {
          control: index + 1,
          name: control.getAttribute("aria-label") || control.textContent?.trim().slice(0, 80) || control.tagName,
          focusVisible: control.matches(":focus-visible"),
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth) || 0
        };
      });
  });
  expect(focusResults.length, `${state} must expose at least one visible enabled control`).toBeGreaterThan(0);
  expect(
    focusResults.filter(result => (
      !result.focusVisible
      || result.outlineStyle === "none"
      || result.outlineWidth < MIN_FOCUS_WIDTH_PX
    )),
    `${state} controls must all retain a visible keyboard focus indicator`
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: async () => {}
    });
  });
});

for (const game of GAME_LIST) {
  test(`A3.5 ${game.title} passes overlay contrast and visible-focus checks`, async ({ page }) => {
    // The WebGL-heavy games can spend more than 45 seconds completing the
    // same Axe, focus and quit-dialog assertions on a hosted software renderer.
    // Keep every assertion and allow the slowest supported renderer to finish.
    test.setTimeout(75_000);
    const deprecatedThreeWarnings = [];
    page.on("console", message => {
      if (
        message.type() === "warning"
        && /THREE\.(?:Clock|WebGLShadowMap)|PCFSoftShadowMap/.test(message.text())
      ) {
        deprecatedThreeWarnings.push(message.text());
      }
    });
    await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}`);
    const dialog = page.getByRole("dialog", { name: game.title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".lg-game-loading")).toHaveCount(0);
    await expectNoColourContrastViolations(page, ".lg-game-player", game.title);
    const onboarding = page.getByRole("dialog", {
      name: `How to play ${game.title}`,
      exact: true
    });
    if (await onboarding.isVisible().catch(() => false)) {
      await expectNoColourContrastViolations(
        page,
        ".lg-game-player",
        `${game.title} first-run instructions`
      );
      await expectAllVisibleControlsHaveFocus(
        page,
        onboarding,
        `${game.title} first-run instructions`
      );
      await onboarding.getByRole("button", { name: "Tap to play", exact: true }).click();
      await expect(onboarding).toBeHidden();
    }
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
    expect(deprecatedThreeWarnings).toEqual([]);
  });

  test(`A3.5 ${game.title} retains focus in forced-colours mode`, async ({ page }) => {
    test.setTimeout(20_000);
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}`);
    const dialog = page.getByRole("dialog", { name: game.title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".lg-game-loading")).toHaveCount(0);
    await expectAllVisibleControlsHaveFocus(page, dialog, `${game.title} forced-colours overlay`);
  });
}

test("A3.5 Sound Racer dark tutorial keeps readable text and visible focus", async ({
  page
}) => {
  await page.goto("/preview/game-overlay.html?game=sound-racer");
  const overlay = page.locator('[data-sr="overlay"]');
  await expect(overlay).toBeVisible({ timeout: 15_000 });
  await expectNoColourContrastViolations(page, '[data-sr="overlay"]', "Sound Racer tutorial");
  await expectKeyboardFocusVisible(
    page,
    overlay.getByRole("button", { name: /^Hear .+ in / }),
    "Sound Racer Hear the example control"
  );
  await expectKeyboardFocusVisible(
    page,
    overlay.getByRole("button", { name: "Tap to play", exact: true }),
    "Sound Racer play control"
  );
});

test("A3.5 locked creature options stay legible in standard and high-contrast modes", async ({
  page
}) => {
  for (const contrast of ["standard", "high"]) {
    const query = contrast === "high" ? "&contrast=high" : "";
    await page.goto(`/preview/quest.html?view=creator&sound=0&adapt=0${query}`);
    const dialog = page.getByRole("dialog", { name: "Change your book character", exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("tab", { name: "Colours", exact: true }).click();
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
