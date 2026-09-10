import { expect, test } from "@playwright/test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";

const ARCADE_GAMES = GAME_LIST.filter(game => (game.surfaces || []).includes("arcade"));

test("every Arcade control keeps browser gestures from stealing iPad input", async ({ page }) => {
  test.setTimeout(180_000);
  // Input-style coverage uses the low rendering tier; cinematic rendering has its own suite.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(gameIds => {
    for (const gameId of gameIds) {
      window.localStorage.setItem(`lp-arcade-onboarded-v1:${gameId}`, "1");
    }
  }, ARCADE_GAMES.map(game => game.id));

  for (const game of ARCADE_GAMES) {
    await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}&sound=0`);
    const player = page.getByRole("dialog", { name: game.title, exact: true });
    await expect(player).toBeVisible();
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 40_000 });

    const controlStyles = await player.locator('button, [role="button"]').evaluateAll(controls =>
      controls.map(control => {
        const styles = getComputedStyle(control);
        return {
          label: control.getAttribute("aria-label") || control.textContent?.trim() || control.tagName,
          touchAction: styles.touchAction,
          userSelect: styles.userSelect || styles.getPropertyValue("-webkit-user-select")
        };
      })
    );

    expect(controlStyles.length, `${game.id} should expose at least one control`).toBeGreaterThan(0);
    expect(
      controlStyles.filter(styles => (
        styles.touchAction !== "none"
        || styles.userSelect !== "none"
      )),
      `${game.id} has controls that Safari can treat as selection or page gestures`
    ).toEqual([]);
  }
});
