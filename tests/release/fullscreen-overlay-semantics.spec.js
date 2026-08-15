import { expect, test } from "@playwright/test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: async () => {}
    });
  });
});

async function dismissActiveGameOnboarding(page) {
  await page.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 15_000 });
  const onboarding = page.getByRole("dialog", { name: /^How to play / }).last();
  await onboarding.waitFor({ state: "visible", timeout: 1_000 }).catch(() => {});
  if (!await onboarding.isVisible().catch(() => false)) return;
  const startButton = onboarding.getByRole("button").first();
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
  } else {
    await onboarding.click({ position: { x: 12, y: 12 } });
  }
  await expect(onboarding).toBeHidden();
}

test("A2.10 every Sound Seekers fullscreen surface exposes its active name", async ({ page }) => {
  const surfaces = [
    { query: "view=creator", name: "Change your book character", close: "Close Change your book character" },
    { query: "view=map", name: "Trail map" },
    { query: "view=post", name: "Trading Post" },
    { query: "view=world&stop=s1&display=2d&active=0", name: "Hollow Tree trail" },
    { query: "view=ceremony&stop=s1&display=2d&motion=reduce", name: "Hollow Tree reward" }
  ];

  for (const surface of surfaces) {
    await page.goto(`/preview/quest.html?sound=0&adapt=0&${surface.query}`);
    const dialog = page.locator(".q-root[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAttribute("aria-label", surface.name);
    await expect(dialog).toHaveAttribute("data-surface-name", surface.name);
    if (surface.close) {
      await expect(dialog.getByRole("button", { name: surface.close, exact: true })).toBeVisible();
    }
  }
});

test("A2.10 fresh book-character creation names the close control from the visible surface", async ({ page }) => {
  await page.goto("/preview/quest-preview.html?scope=fullscreen-a11y&reset=1&sound=0");
  const dialog = page.getByRole("dialog", { name: "Choose your book character", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close Choose your book character", exact: true })).toBeVisible();
});

test("A2.10 every registered game overlay and quit prompt uses the game title", async ({ page }) => {
  test.setTimeout(120_000);
  for (const game of GAME_LIST) {
    await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}`);
    const dialog = page.getByRole("dialog", { name: game.title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAttribute("data-surface-name", game.title);

    const close = dialog.getByRole("button", { name: `Close ${game.title}`, exact: true });
    await expect(close).toBeVisible();
    await dismissActiveGameOnboarding(page);
    await close.click();
    await expect(page.getByRole("alertdialog", { name: `Quit ${game.title}`, exact: true })).toBeVisible();
  }
});

test("A2.10 resume prompt also derives its name from the active game", async ({ page }) => {
  const game = GAME_LIST[0];
  await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}&resume=1`);
  await expect(page.getByRole("dialog", { name: game.title, exact: true })).toBeVisible();
  await expect(page.getByRole("alertdialog", { name: `Resume ${game.title}`, exact: true })).toBeVisible();
});
